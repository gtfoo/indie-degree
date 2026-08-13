# Indie Degree

**Build your own degree, and prove you did it.**

Indie, in the sense that indie film and indie games are indie: produced outside
the institution, deliberately, and judged on the work rather than on who signed
it off.

This repository contains a complete, self-directed programme in **AI
Engineering** — 15 courses, 944 hours, 51 credits — plus the machinery that
keeps it honest. Fork it, swap the corpus, and build an indie degree in
something else.

---

## The problem this solves

Anyone can generate a learning plan. The hard part is that a generated
curriculum is worthless if its sources are invented, and a self-awarded
credential is worthless if its claims are unverifiable.

So the whole system is built around two rules.

### 1. The model selects sources; it never invents them

Every resource declares **how its identity can be checked**, and the checker
verifies the identity rather than settling for an HTTP 200 — YouTube serves 200
for deleted videos, and a renamed page still resolves.

| Type | Method | Strength |
|---|---|---|
| `youtube`, `youtube_playlist` | oEmbed → real title **and channel** | strong |
| `arxiv` | arXiv API → real title, falling back to the abs page | strong |
| `book` | OpenLibrary by ISBN → real title | strong |
| `github` | GitHub API → repo exists, not archived | strong |
| `web` | GET + a required literal substring | moderate |
| `pdf` | GET + Content-Type | **weak — liveness only** |

The method is recorded on every row, so a reader can see which guarantee they
are getting instead of assuming.

It earns its keep. Building this corpus it caught:

- Stanford has made the Andrew Ng **CS229 (2018)** lectures private — the
  playlist and its videos all return 401. The most-recommended ML lecture series
  on the internet is a dead link.
- The only individually-citable copies of **Stanford CS336** belong to a
  third-party re-upload channel; Stanford's own videos disable embedding. A
  plain link-checker would have happily shipped the unauthorised copies.
- Several of the author's own resource titles were simply wrong.

**203 resources. Every one verified. Zero dead links.**

### 2. Every claim carries its evidence tier

| Tier | Means | Counts toward mastery |
|---|---|---|
| 0 | Self-marked | **No** |
| 1 | Machine-verified — tests pass, number reproduced | Yes |
| 2 | Panel-assessed against a rubric registered *before* submission | Yes |
| 3 | Artifact in the world — public repo, deployed service, published result | Yes |
| 4 | Defended aloud, unscripted | Yes |

A reader does not have to trust the grade. They can see how it was earned.
Tier 0 is tracked and deliberately worth nothing, so "I read the chapter" can be
recorded honestly without inflating anything.

---

## What's in here

```
src/products/curriculum/
  resources.json            the corpus, hand-authored
  resources.verified.json   generated — only what passed
  programme.json            15 courses, 75 skills, the skill DAG
  advanced-standing.json    credit for work already shipped
  courses/AIE-*.json        7 full course specs
  PROGRAMME.md              generated, readable
  RESOURCES.md              generated, readable
  AIE-*.md                  generated, readable

scripts/corpus/
  verify.py                 identity-checks every resource
  validate.py               checks the programme hangs together
  render.py                 renders the JSON as Markdown

src/                        a Next.js app for tracking progress
```

```bash
npm run curriculum   # verify → validate → render
npm run dev          # the tracker
```

All three scripts are **stdlib-only Python**. There is nothing to install.

---

## The programme

**Block I — Applied AI Engineering** (7 courses, 364 hours, 23 credits)

| # | Code | Course |
|---:|---|---|
| 1 | AIE-101 | LLM Application Engineering |
| 2 | AIE-102 | Evaluation and Measurement |
| 3 | AIE-107 | Architecture and Judgement |
| 4 | AIE-105 | Inference, Cost and Latency Engineering |
| 5 | AIE-103 | Retrieval and Context Systems |
| 6 | AIE-104 | Agents and Tool-Use Systems |
| 7 | AIE-106 | Speech and Multimodal Systems |

**Block II — Depth** (8 courses, mapped, not yet specified) — mathematics,
machine learning, deep learning, transformers from scratch, fine-tuning,
reinforcement learning, systems, and a capstone.

Courses are ordered by **value within prerequisite constraints**, so stopping at
any point still leaves the highest-value skills banked. `validate.py` treats a
course ranked ahead of its own prerequisite as an error.

---

## Design decisions worth stealing

**Progress is banked; there are no streaks.** On an irregular schedule a streak
counter is a quit trigger — three weeks off and the app tells you you have
failed, so you stop opening it. There is no streak table and no current-streak
column anywhere in the schema. Everything recorded only goes up.

**One sitting, one item.** No item exceeds 180 minutes, and anything over 90
declares its own checkpoints. The schema enforces the cap with a CHECK
constraint rather than a convention.

**Rubrics are frozen into submissions.** Pre-registration is meaningless if a
later edit can retroactively change a grade, so the rubric is stored *with* the
submission rather than referenced by id.

**Judges disagree in public.** One row per judge per criterion, never
pre-aggregated. When the spread reaches 2 the grade is marked contested and the
transcript shows it. Grades are computed in TypeScript; no model writes a score.

**Cite where, not just what.** Anything pointing at a book, repo, whole course
or documentation site must declare a locator — chapter, path, or section.
`validate.py` errors otherwise. An item titled "Prompt caching" that resolves to
a documentation homepage is a broken citation wearing a good title.

**Advanced standing is stingy on purpose.** Prior work is credited at Tier 3
with every award stating what cuts *against* it. A transcript generous to itself
is worth nothing.

---

## Forking this for another subject

1. Replace `resources.json` with your own corpus, keeping the `type`/`ref`
   fields so identity checking still works.
2. Rewrite `programme.json` — courses, credits, prerequisites, and the skill DAG.
3. Pick your own course prefix. Codes name the *subject*, not the platform:
   `AIE` here, `BIO` or `LAW` for yours.
4. Run `npm run curriculum`. Fix what it complains about.

The validator will not let you ship a curriculum that references a skill it
never teaches, orders a course before its prerequisite, cites an unverified
resource, or awards a credit it cannot account for.

---

## Status

Phase 0 (curriculum) and Phase 1 (the study loop) are done. Assessment — the
judging panel, submissions and the public transcript — is Phase 2 and not built
yet. The evidence tiers exist in the schema and the rubrics; nothing grades
automatically so far.

Built by [gtfoo](https://gtfoo.com).
