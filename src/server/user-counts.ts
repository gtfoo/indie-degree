/**
 * What this app reports about itself to gtfoo.com/admin.
 *
 * Contract: gtfoo/docs/user-counts.md. Counts only — never emails, ids or
 * per-person timestamps. A shared file one app writes and another reads is the
 * wrong place to widen what is known about a person, and there is no feature
 * here that a count does not serve.
 *
 * Two values are deliberately null rather than zero, on the same rule as
 * `usd: null` in the usage schema:
 *
 * - `passkey` — this app offers magic link only. There is no authenticators
 *   table and no @simplewebauthn dependency. Reporting 0 would advertise a
 *   sign-in method that does not exist.
 * - `active_30d` — sessions here are JWTs, so no sign-in is ever written down.
 *   The number is not small, it is unmeasured. Reporting 0 would assert nobody
 *   signed in; reporting 1 would be a guess. Work logged in the last 30 days is
 *   a real number this app has, but it answers a different question and
 *   substituting it silently under a field named "signed in" is exactly the
 *   dishonesty the contract exists to prevent.
 */

import { writeFileSync, renameSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "./db";

const APP = "indie-degree";

/** Absolute, and overridable, like every other path this app writes. */
function usageDir(): string {
  return process.env.USAGE_DIR ?? "/var/lib/usage";
}

export interface UserCounts {
  app: string;
  generated: string;
  users: {
    total: number;
    magic_link: number | null;
    passkey: number | null;
    active_30d: number | null;
  };
}

export function collect(): UserCounts {
  const db = getDb();
  // "Completed sign-in at least once" is this app's definition, and the adapter
  // only writes a row once a magic link has actually been used.
  const row = db
    .prepare(`SELECT count(*) AS n FROM users WHERE email_verified IS NOT NULL`)
    .get() as { n: number };

  return {
    app: APP,
    // UTC, so the strings sort lexicographically — the usage schema's rule.
    generated: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    users: {
      total: row.n,
      magic_link: row.n,
      passkey: null,
      active_30d: null,
    },
  };
}

let written = false;

/**
 * Fire and forget. A failed write must never fail a sign-in or a page render:
 * this is a number on someone else's dashboard, and nothing here is worth
 * taking the app down for.
 */
export function reportUserCounts(force = false): void {
  if (written && !force) return;
  written = true;
  try {
    const dir = usageDir();
    mkdirSync(dir, { recursive: true });
    const target = join(dir, `${APP}.users.json`);
    // Temp file in the same directory, then rename — the dashboard reads these
    // concurrently and a truncating writer lets it read half a document. This
    // is why the directory is group-writable rather than the files pre-created.
    const tmp = `${target}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(collect(), null, 2) + "\n", "utf-8");
    renameSync(tmp, target);
  } catch {
    // Deliberately silent. Locally /var/lib/usage does not exist, and a missing
    // dashboard file is not a fault worth logging on every render.
  }
}
