# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation
notices.

## Shared droplet contract

@~/Git/INFRA.md

## Correspondence and tasks

Live mail is in `MAIL.md`, closed mail in `MAIL-ARCHIVE.md`, and what this app
owes in `TASKS.md`. None is imported here — mail and task state churn, and
loaded into every session they bury the rules below them. **Read `TASKS.md`
before starting work.**

The flow, the letter format and the carve-outs live in `INFRA.md`, which is
imported above — so they are already in this session and are deliberately not
restated here. A local copy only drifts: this section taught the pre-`From:`
format for two days after the canonical one changed, and a paragraph that can
only ever go stale against the file it duplicates is not worth the reach it
adds. `~/Git/check-comms.sh` enforces the protocol and exits non-zero.

A `SessionStart` hook in `.claude/settings.json` counts unread letters so the
owner is not the notification layer. It greps inline rather than running the
full checker, which takes about eight seconds of network calls and should not
tax every session start.

**It reaches this inbox as of 2026-08-31.** For its first week it did not: the
hook fires only for sessions rooted in the repo holding it, and sessions for this
app were opened in `~/Git/gtfoo`, so gtfoo's hook fired instead — it announced
three unread letters on a session where this inbox held none. The owner has since
moved every agent into its own repo, and the same test now reports one letter
here against gtfoo's three, which is the diagnosis run in reverse. It greps a
*relative* `MAIL.md`, so it stays correct only while sessions start here.

Mail is tracked in git here, so **content is the only guard**. Ports, deploy
paths and env-var names are the accepted map; key material, IPs,
`authorized_keys` and fail2ban tuning are not — a deploy key's public half sat
in this mailbox for a day before the droplet agent's checker found it.

---

# Rules for this app

**The curriculum is the source of truth, not the database.** Everything in
`src/products/curriculum/` is validated by `scripts/corpus/validate.py` before
it lands, and the app imports it directly. SQLite holds only what cannot be
regenerated: progress, checkpoints and study sessions. A reseed must never be
able to touch those tables.

**Never add a resource by hand without running the checker.** `verify.py`
confirms a resource is the thing it claims to be — title from the source's own
API, not an HTTP 200 — and records which method proved it. A curriculum whose
sources were never verified is the failure mode this whole project exists to
avoid.

```bash
npm run curriculum   # verify -> validate -> render
```

**`render.py` output is generated. Never hand-edit the Markdown** in
`src/products/curriculum/*.md`. Edit the JSON and re-render.

**Reads are public; writes belong to one account.** `GET /api/progress` needs
nothing. Every write path calls `isOwner()` server-side — hiding a control in
the UI is a courtesy, not a permission. The allowlist is checked when a sign-in
link is *requested*, not when it is used, so this app cannot be turned into a
way to email strangers.

**Progress only ever goes up.** Hours are banked the first time an item is
completed and never again; unticking and reticking must not bank them twice.
There is deliberately no streak, and no column anywhere that can decrease — on
an irregular schedule a broken streak reads as failure and stops you opening
the app at all.

**`DATA_DIR` has no default and must not acquire one.** A path inside the tree
would let SQLite create an empty database that boots, reports healthy and serves
an empty transcript — indistinguishable from "no progress yet". Failing loudly
is the feature.

**Route handlers, not Server Actions, for anything a long-lived page calls.**
Action ids regenerate on every build, so a tab open across a deploy POSTs a
stale id and 404s — which on this droplet also looks exactly like the hostile
probe the fail2ban jail bans. Sign-in is the deliberate exception: Auth.js is
built on Server Actions, and those fire once from a page nobody leaves open.
