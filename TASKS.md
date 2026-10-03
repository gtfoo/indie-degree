# Tasks — indie-degree

What this app owes. **Written only by the indie-degree agent**; readable by
anyone. Tasks may be *suggested* by the owner, by this agent, or by another
agent — they arrive as mail and get recorded here. Never imported: this file
churns.

Every task carries a `from:` pointer, because the reasoning behind it usually
lives in a letter or a commit, and a one-line task strands the *why*.

> **Seeded 2026-08-15**, on the droplet agent's adoption audit. Items are
> transcribed from correspondence and from this repo's own decisions.

## Open

- [ ] **Build the ten remaining capability artifacts** — `/capabilities` names
      one per claim (`retrieval-bench`, `agent-vs-workflow`, `llm-or-not`, and
      the rest) and every claim stays unearned until its artifact is public
      *and* its negative result is written down. This is the lab programme and
      the real body of remaining work.
      `from: owner · plan phase 4-5 · the point of the programme`

- [ ] **Write the AIE-102 M2.5 gold set, and run the harness against it** —
      `tools/eval-harness` exists and its artifact requirement is met, but it
      has only a fixture corpus, so it has never measured anything. 30 cases
      with at least 6 negatives. **The learner writes this**: an agent
      authoring the gold set destroys the only thing it is for. Until then the
      evaluation claim sits at one of five.
      `from: indie-degree · tools/eval-harness/README.md · owner's coursework`

- [ ] **Document a negative result for evaluation** — where this approach
      measurably stops working. Required evidence, not a bonus, and the one
      part of a capability claim nobody can fake.
      `from: indie-degree · programme.json areas.evaluation.artifact`

- [ ] **Paste-back UI for panel judgements — the page, not the feature.** The
      server half is built and was already built when this task was written:
      the `submissions`, `self_assessments`, `judgements` and `judgement_scores`
      tables, `src/server/submissions.ts` enforcing score-yourself-before-judge,
      `parseScores.ts`, and `POST /api/submission`. What is missing is the
      owner-gated page a human pastes into, and keeping prior versions when a
      judgement is replaced.
      `from: owner · 2026-08-15 · scope corrected 2026-09-20 against the repo`

- [ ] **Batch pushes to main.** Each deploy builds into the tree the live
      process is serving from, so every push is a window where the site can
      return 500. On 2026-08-16 there were eleven pushes and one of them served
      30 real errors; the other ten were luck. **Standalone is not atomic** —
      the unit says `Next.js, standalone` and that protects nothing here. Fixed
      properly by phase 2 below; until then the only lever is fewer deploys.
      `from: droplet → indie-degree · MAIL-ARCHIVE.md 2026-08-16`

- [ ] **Phase 2 migration, when the droplet agent schedules it** — volunteered
      to go first. Answers delivered 2026-08-15 after sitting undelivered since
      08-14. The parts that must survive into whatever gets built: pin the
      runner's Node to the droplet's exact version, and move the constructing
      ABI guard onto the droplet after rsync and before the symlink flip,
      because the artifact carries compiled binaries and builder and runtime
      must match on ABI, CPU architecture and libc.
      `from: droplet → indie-degree · INFRA.md#phase-2 · not yet scheduled`

- [ ] **Explain the `/skills/*` latency tail** — droplet reports every
      `/skills/*` page at ~2,750ms and a box-high p95 of 1,344ms. Not
      reproducible from outside: 20 samples per route give a **105ms median**,
      with a real tail of 1-in-20 at 1.1–1.3s on `/skills/*` against nothing
      above 206ms on `/`. `skillGraph()` is now memoised, which removes the only
      genuine per-request work, but 75 nodes cannot cost 2.6s and five of the six
      slow examples are `/skills/<id>`, which never called it. Asked how the
      figures were produced before optimising further.
      `from: droplet → indie-degree · MAIL-ARCHIVE.md 2026-09-20`

- [ ] **Four HTTP 500s on `/`, 2026-09-14 04:54** — four inside one minute, none
      before or since, 9–36ms each, so something threw rather than hung; the
      service shows 0 restarts in 7 days. The access log cannot say what. Asked
      droplet for the journal lines, which are on the box and out of my reach.
      `from: droplet → indie-degree · MAIL-ARCHIVE.md 2026-09-20`

- [ ] **Pin the grading panel's model aliases** — the panel names
      `gemini-flash-latest`, a floating alias, while
      `tools/eval-harness/README.md` rejects exactly that shape because a
      vendor's new checkpoint would be indistinguishable from a real change.
      Found while declining Jev for the same property, and the weakness is mine
      rather than Jev's — which is why it is recorded here instead of being used
      as an argument there.
      `from: indie-degree · 2026-10-02 · tools/eval-harness/README.md:22`

## Declined

- ~~**Jev as a fourth judge on the grading panel**~~ — declined 2026-10-02. Not on
      cost: at $0.0247 per thousand judgments the spend objection is gone. The
      open counter-proposal above is a model that *diagnoses* disagreement, and
      Jev cannot generate explanations by design, so it can only fill the role
      already declined — resolving the grade — with a probability attached. That
      probability is more honest than a confident paragraph and does not change
      the shape. Separately, `gradingPrompt.ts` offers every judge
      `"not verifiable"` on 45 of 251 criteria and `parseScores.ts` records it
      as `null`, never `0`; Jev's Score primitive cannot abstain, and encoding
      the rubric as a Choice to recover it discards the ordinal.
      **Open, not declined:** Jev in an opt-in `eval-harness` judge scorer, if
      one is ever added — dev-time, replay-default, and the learner's call.
      `from: gtfoo → indie-degree · MAIL-ARCHIVE.md 2026-10-02`

- ~~**An LLM that emits the final grade**~~ — declined as specified.
      Aggregating three judges is arithmetic; a model doing it reintroduces the
      single-model opinion the panel exists to avoid, with a laundering step
      that makes it look more rigorous. The counter-proposal — a fourth model
      that *diagnoses the disagreement* while the arithmetic stays
      deterministic — is open, not declined.
      `from: owner · 2026-08-15`

- ~~**A second analytics collector**~~ — standing agreement with the
      droplet agent: collection is shared across all sites and app agents build
      views on the same files.
      `from: droplet · INFRA.md#interface-contract`

- ~~**Emitting `/var/lib/usage` rows**~~ — this app makes no runtime model
      calls, so there is nothing to meter. Per `INFRA.md` that is likely the
      permanent and correct answer here, not a deferral.
      `from: droplet · INFRA.md#usage-emission`
