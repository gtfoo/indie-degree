# Indie Degree — Phase 0

A self-directed AI Engineering programme, and the system that makes its claims
checkable by someone who has no reason to trust them.

Phase 0 produced no UI. It produced the curriculum, the machinery that keeps
the curriculum honest, and the decisions below. The gate at the end of Phase 0
is a judgement call that belongs to the learner, not to this document: **is
this curriculum good enough to commit to?**

## What exists

```
scripts/corpus/verify.py        identity-checks every resource
scripts/corpus/validate.py      checks the programme hangs together
scripts/corpus/render.py        renders the JSON as readable Markdown
src/products/indie-degree/
  curriculum/
    resources.json              108 candidate resources, hand-authored
    resources.verified.json     generated — only what passed
    verification-report.md      generated — what failed and why
    programme.json              14 courses, 65 skills, the skill DAG
    advanced-standing.json      credit for work already shipped
    courses/
      AIE-102-evaluation-and-measurement.json   the first course, in full
    PROGRAMME.md                generated — the readable programme
    RESOURCES.md                generated — the readable corpus
    AIE-102.md                   generated — the readable course
  schema.sql                    33 tables
  DESIGN.md                     this file
```

```bash
python scripts/corpus/verify.py && python scripts/corpus/validate.py && python scripts/corpus/render.py
```

The three Markdown files are generated, never hand-edited — a prose copy
maintained by hand would drift from the JSON within a week. Edit the JSON and
re-render.

Both are stdlib-only Python. `verify.py --retry-failed` re-checks anything not
currently verified, which matters because a timeout is cached like any other
outcome and arXiv rate-limits under concurrency.

## Decisions

### The transcript is the artifact, not a diploma

The structure is degree-shaped — blocks, credits, prerequisites, a capstone —
because that structure is what makes it rigorous. What gets published is a
transcript with evidence tiers and linked artifacts.

A self-conferred degree pattern-matches to a fake credential and costs an
interview arguing about framing instead of about work. The same body of work
described as a completed self-designed curriculum reads as ambitious. The data
model is indifferent: `programmes.framing` switches it, and nothing else
depends on the choice.

### Every claim carries its evidence tier

| Tier | Means | Counts toward mastery |
|---|---|---|
| 0 | Self-marked | **No** |
| 1 | Machine-verified | Yes |
| 2 | Panel-assessed against a pre-registered rubric | Yes |
| 3 | Artifact in the world | Yes |
| 4 | Defended aloud, unscripted | Yes |

A reader does not have to trust the grade — they can see how it was earned.
Tier 0 is tracked and deliberately worth nothing, which is why "I read the
chapter" can be recorded honestly without inflating anything.

### The model selects resources; it never invents them

Hallucinated coursework is the obvious way this fails: invented ISBNs, dead
lectures, courses that never existed. So every resource declares how its
identity can be checked, and the check compares the *observed title* against
the claimed one rather than settling for HTTP 200.

| Type | Method | Strength |
|---|---|---|
| youtube, youtube_playlist | oEmbed → title | strong (400/404 when gone) |
| arxiv | arXiv API → title | strong |
| book | OpenLibrary by ISBN → title | strong |
| github | GitHub API → repo, archived flag | strong |
| web | GET + required literal substring | moderate |
| pdf | GET + Content-Type | **weak — liveness only** |

The method is stored per row so the weak guarantee is never displayed as if it
were a strong one. This is the same move Career Side Quests makes with verbatim
evidence quotes: hallucination becomes a cheap string check.

It earned its keep immediately. Stanford has made the Andrew Ng CS229 Autumn
2018 recordings private — playlist and individual videos both return 401 — and
two of my resource titles were wrong. All three would have surfaced as a dead
link in week three instead of before the curriculum was fixed.

**108 of 108 resources verified. Zero dead links.**

### Ordering is value-weighted, and the validator enforces it

Courses carry a `value_rank`. The promise is that stopping at any point leaves
the highest-value skills already banked, so an unfinished programme is still a
gain — and that promise is void if a course is ordered ahead of its own
prerequisite. `validate.py` treats that as an error. It caught two on the first
run, including Transformers ranked above the Deep Learning course it depends on.

Applied-first ordering does mean some skills are used before they are derived:
you measure a judge before you can prove the statistics, and call attention
before you can differentiate it. Those are deliberate, and each one must be
declared in `accepted_inversions` with a rationale. Undeclared inversions
warn — and so do *stale* declarations, so the exception list cannot quietly
become a dumping ground. Five of my eleven turned out to be stale once the
ranks were fixed.

### Progress is banked; there are no streaks

Pacing is irregular by design. On an irregular schedule a streak counter is a
quit trigger: three weeks off and the app tells you you have failed, so you
stop opening it. There is deliberately no streak table and no current-streak
column anywhere in the schema.

Everything recorded is monotonic — cumulative hours, credits, skills at
mastery, artifacts shipped. Nothing is destroyable by a quiet month.

Two consequences carried into Phase 1: a **cold-start view** that re-orients
after a long gap and hands back one small resumable thing, and **projected
completion as a range derived from logged minutes** in `study_sessions`, never
from intended hours per week.

### One sitting, one item

No item exceeds 180 minutes; anything over 90 declares its own checkpoints. The
schema enforces the cap with a CHECK constraint rather than a convention, and
the validator warns on long items without checkpoints.

This caught a real flaw in my own first draft: the AIE-102 project was a single
420-minute item sitting directly under the rule forbidding it. It is now three
items split along the checkpoints it had already declared.

### Python is the medium, never an objective

It is not a course and never appears as a learning outcome. It is the language
Block II runs in because PyTorch and the numeric stack live there, and it gets
evidenced as a byproduct of doing the work. On a CV its absence reads as
"hasn't done ML work", and the fix for that is an artifact, not a course —
`verify.py` and `validate.py` are the first one.

### Rubrics are frozen into submissions

Pre-registration is meaningless if a later rubric edit can retroactively change
a grade, so `submissions.rubric_json` stores the rubric as it stood at
submission time rather than referencing it by id.

### Judges disagree in public

One row per judge per criterion, never pre-aggregated. When the spread reaches
2 on any criterion the grade is marked `contested` and the transcript shows it
as a wide spread. Averaging that away would be exactly the failure AIE-102
teaches the learner to detect.

Grades are computed in TypeScript from tiered evidence. No model writes to
`grades`.

### Advanced standing is deliberately stingy

**4 credits of 45. 12 skills of 65.**

Prior work maps onto the programme at Tier 3, with every award stating what
cuts against it. `AIE-102` was awarded **zero**, on purpose: there is one real
measurement loop across four shipped products and no eval harness anywhere.
Awarding credit there would be precisely the self-flattery this programme
exists to avoid — and it is the reason AIE-102 is the first course studied.

This is not the same number as the Career Side Quests read, which scored 94%
against one job posting. A posting asks for less than a curriculum does. Both
are true: close to the bar for the role, early in the programme.

### Curriculum tables are derived; learner tables are durable

The JSON in `curriculum/` is the source of truth, because it is reviewable in a
diff and validated before it reaches the database. Everything marked
`-- derived` in `schema.sql` can be dropped and reseeded. Everything else is
the record of work actually done and no reseed may touch it.

## The honest numbers

| | Hours | At 6–12 h/week |
|---|---:|---|
| Block I (applied core) | 296 | — |
| less advanced standing | −62 | — |
| **Block I remaining** | **234** | **4–9 months** |
| Whole programme | 876 | — |
| less advanced standing | −62 | — |
| **Remaining** | **814** | **1.3–2.6 years** |

Advanced standing is priced pro-rata against each course's own hours, not at
the programme's average of 20 per credit — the courses vary, and most of the
standing sits on AIE-101, which runs 15. These figures are computed by
`render.py` rather than asserted here, so they cannot drift from the JSON.

This is the number I promised would be visible rather than hidden. Scope came
from the target, as agreed — not one course was cut to make the calendar look
better. But the calendar is what it is, and it is worth deciding about
deliberately rather than discovering in month nine.

Three responses are all defensible, and the choice is the learner's:

1. **Accept it.** Block I lands inside a year and is the employable part;
   Block II continues indefinitely and the transcript grows as it goes.
2. **Treat Block II as optional depth.** Ship the transcript at the end of
   Block I. Honest, and considerably faster.
3. **Cut Block II's breadth.** AIE-206 (Reinforcement Learning) is ranked
   thirteenth for a reason and is the obvious candidate; AIE-207 is the next.

## Phase 1

Build the study loop and nothing else: programme, course and item views, banked
progress, cold-start, the skill tree, velocity-based date range. Single learner,
SQLite beside `learnindo.sqlite`, no new service on the droplet.

Then use it for two weeks before another feature gets written. If the loop does
not produce study, no amount of assessment machinery will.

## Open

- **The panel grades using a mechanism the course teaches you to distrust.**
  Recorded in the AIE-102 spec as a deliberate conflict: coursework that
  demonstrates the panel is miscalibrated earns credit rather than losing it.
  Whether that is enough remains genuinely unsettled.
- **Tier 4 defense integrity.** Reading from a prepared text is the obvious
  attack. Current mitigation is questions generated at defense time from the
  submission, plus a panel instruction to flag register shifts. Untested.
- **Which course goes deep second** is not decided, and should not be until
  AIE-102 has been studied rather than designed.
