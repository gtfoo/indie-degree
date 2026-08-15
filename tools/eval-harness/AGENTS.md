# Rules for eval-harness

A dev-time tool. **It is never deployed to the droplet** — no systemd unit, no
Caddy host, no port, no entry in the shared deploy lock. If you find yourself
writing a `scripts/deploy.sh` here, stop: the box is 1 GB and this thing has no
business running on it.

Owned by the indie-degree agent, because it is the artifact behind that
programme's *LLM evaluation* capability claim. It is not any app's agent, and it
does not read any app's source.

## The one rule that makes this tool worth having

**Scoring never calls a model.** `score` reads a run file produced elsewhere.
The moment scoring makes a network call, a score stops being reproducible, and
"my code regressed" becomes indistinguishable from "the vendor changed the
model". If a live runner is ever added it goes in the app that owns the system
under test, and it emits a run file.

An LLM judge, should one ever be added here, is opt-in, off by default, never
part of `npm run check`, and reported in its own column — never blended into a
deterministic score.

## Coupling: none, on purpose

The harness reads exported JSONL. It does **not** import from
`1-percent-more-fluent`, `career-side-quests`, `carpark-sg` or `gtfoo`, and it
must not grow a path into any of them. Those repos have their own agents; a
trace export is the whole interface. This is what let v1 ship without asking any
of them for anything.

## No dependencies

Runtime dependencies: zero, and it should stay that way. TypeScript and
`@types/node` are dev-only, and there is no build step — `--experimental-strip-types`
means the source you read is the source that runs. A scoring tool that needs a
toolchain to audit is a scoring tool nobody audits.

Tests are `node:test`. `npm run check` is typecheck plus tests.

## Two things the code deliberately refuses to do

- **Skip a missing output.** It scores zero. Skipping lets a run that dropped
  half the corpus report a better average than one that attempted everything.
- **Print an aggregate alone.** Tags first, overall last and labelled. This is
  not a formatting preference; a single number is the mechanism by which a real
  regression gets reported as an improvement.

## Corpora

A corpus in `corpora/` is either a real gold set or a fixture, and the directory
name says which. `fixture-*` exists to exercise the harness and demonstrate the
format — it must never be cited as evidence of anything.

**Gold sets are coursework.** The 30-case evidence-extraction set is Indie
Degree's AIE-102 M2.5, and the learner writes it. An agent authoring it would
destroy the only thing it was for.
