#!/usr/bin/env bash
#
# Build the currently checked-out commit and restart the service.
#
# The GitHub Actions "Deploy to droplet" workflow updates git first, then runs
# this over SSH. To deploy by hand on the droplet:
#
#     cd ~/indie-degree && git pull --ff-only && bash scripts/deploy.sh
#
# Configuration and the database live OUTSIDE this tree, supplied by systemd.
# Nothing here touches them; a hard-reset deploy cannot destroy them, which is
# the entire point of keeping them out.
set -euo pipefail

# Repo root, regardless of where it's cloned or called from.
cd "$(dirname "$0")/.."

# This script runs over SSH while the checkout is owned by `deploy`, which newer
# git refuses to read ("detected dubious ownership"). The deploy still works
# without this, but every git call fails silently — so the closing line reports
# an empty commit, and a deploy log that cannot tell you what is live is worse
# than no deploy log.
git config --global --add safe.directory "$PWD" >/dev/null 2>&1 || true

# ---------------------------------------------------------------- the lock
#
# One box, five Next apps, and each repo's CI concurrency group only serializes
# against ITSELF — GitHub cannot serialize across repositories. Two apps have
# already built simultaneously here; on this much RAM that is not a slow deploy,
# it is an OOM. The lock is shared BY PATH, so every app must use the same file.
#
# 0666 deliberately: it carries no data, only the lock, and a root-owned lock
# that CI cannot open is a deploy that fails for the wrong reason.
LOCK="${DEPLOY_LOCK:-/var/lock/droplet-deploy.lock}"
if command -v flock >/dev/null 2>&1; then
  if [ ! -e "$LOCK" ]; then
    ( umask 000; : > "$LOCK" ) 2>/dev/null || true
  fi
  # "Cannot open" and "waited and timed out" are different failures and must
  # read differently — collapsing them once sent a diagnosis in entirely the
  # wrong direction.
  if exec 9>"$LOCK"; then
    if flock -w 1800 9; then
      echo "==> holding $LOCK"
    else
      echo "!!  another deploy held $LOCK for 30 minutes; giving up." >&2
      exit 1
    fi
  else
    echo "!!  cannot open $LOCK (permissions?) — continuing WITHOUT the lock." >&2
    echo "!!  fix: sudo chmod 666 $LOCK" >&2
  fi
else
  echo "!!  flock unavailable — deploys are NOT serialized on this host." >&2
fi

# Use whatever Node this host actually has. There is no nvm on the droplet, so
# an `nvm use 20` line silently does nothing here while firing on a dev machine
# that does have nvm — pinning that build to the wrong ABI without saying so.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm use --lts >/dev/null 2>&1 || true
fi
echo "==> node $(node -v) / npm $(npm -v)"

SERVICE="${INDIE_SERVICE:-indie-degree}"

# The native addon build is the memory-hungriest step and this box has run out
# before. Report the headroom so a failed deploy is diagnosable from the log.
if command -v free >/dev/null 2>&1; then
  echo "==> memory available: $(free -m | awk 'NR==2{print $7}') MB"
fi

# DATA_DIR is where progress lives. The app refuses to start without it, so say
# so here rather than after a restart that only fails on the first request.
DATA_DIR_CHECK="${DATA_DIR:-}"
if [ -z "$DATA_DIR_CHECK" ]; then
  echo "!!  DATA_DIR is not set in this shell. That is expected for a CI deploy" >&2
  echo "!!  (systemd supplies it to the service), but if the service fails to"  >&2
  echo "!!  serve after this, check the unit's Environment= line first."        >&2
elif [ -f "$DATA_DIR_CHECK/indie-degree.sqlite" ]; then
  echo "==> database present: $DATA_DIR_CHECK/indie-degree.sqlite ($(du -h "$DATA_DIR_CHECK/indie-degree.sqlite" | cut -f1))"
fi

echo "==> npm ci"
npm ci

# better-sqlite3 is a native addon. Compiled against a different Node ABI than
# the one serving, it fails on the first database request — so the deploy would
# report success and the site would 500 later.
#
# It must CONSTRUCT, not merely require: the addon is not referenced in the
# entry file at all; it loads inside the Database constructor, so
# `require('better-sqlite3')` exits 0 on a genuine mismatch and cannot fail.
#
# Unconditional, and BEFORE the build. `npm ci` is commonly a no-op when the
# lockfile is unchanged, while the host's Node can still move underneath an
# untouched node_modules — and a bad addon should fail in seconds rather than
# after a full compile. `:memory:` opens no file and touches no live database.
if [ -d node_modules/better-sqlite3 ]; then
  node -e "new (require('better-sqlite3'))(':memory:').close()" \
    && echo "==> better-sqlite3 constructs under $(node -v)" \
    || { echo "!!  better-sqlite3 ABI mismatch — not building, not restarting." >&2; exit 1; }
fi

echo "==> next build"
npm run build

# Next does not copy these into the standalone bundle. Miss them and the site
# serves HTML that returns 200 while every stylesheet and script 404s — which is
# why the check below asks for a static asset rather than the page.
if [ -d .next/standalone ]; then
  cp -r .next/static .next/standalone/.next/static
  [ -d public ] && cp -r public .next/standalone/public
  echo "==> standalone bundle assembled ($(du -sh .next/standalone | cut -f1))"
else
  echo "!!  no .next/standalone — is output:'standalone' still set?" >&2
  exit 1
fi

echo "==> restarting ${SERVICE}"
sudo systemctl restart "${SERVICE}"

# Confirm it actually came back. A silent restart failure looks identical to a
# successful deploy in the Actions log, which is how a site stays down unnoticed.
sleep 4
if ! systemctl is-active --quiet "${SERVICE}"; then
  echo "!!  ${SERVICE} did not come back up:" >&2
  systemctl status "${SERVICE}" --no-pager --lines=20 >&2 || true
  exit 1
fi

# Serving HTML is not the same as serving the site. Fetch a hashed asset from
# the build we just made — that is the thing the standalone copy step above can
# silently omit, and the page will return 200 either way.
#
# Take ANY file under .next/static rather than guessing a subdirectory. An
# earlier version of this looked for .next/static/css/*.css, which this build
# does not produce at all (Tailwind v4 inlines into chunks), so the check found
# nothing, skipped itself, and reported success while proving nothing. If no
# asset can be found, that is a failure — a build with no static output is not
# a build worth restarting for.
if command -v curl >/dev/null 2>&1; then
  PORT="${INDIE_PORT:-3003}"
  ASSET=$(find .next/static -type f -printf '%P\n' 2>/dev/null | head -1 || true)
  if [ -z "$ASSET" ]; then
    echo "!!  no files under .next/static — nothing to verify, refusing to call this deployed." >&2
    exit 1
  fi
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/_next/static/${ASSET}"; then
    echo "==> static asset served (${ASSET})"
  else
    echo "!!  /_next/static/${ASSET} does not serve — .next/static did not make it" >&2
    echo "!!  into the bundle. The page will still return 200; the site is broken." >&2
    exit 1
  fi
fi

echo "==> deployed $(git rev-parse --short HEAD) on $(hostname)"
