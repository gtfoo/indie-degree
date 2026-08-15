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

- [ ] **Build the eleven missing capability artifacts** — `/capabilities` now
      names one per claim (`eval-harness`, `retrieval-bench`,
      `agent-vs-workflow`, `llm-or-not`, and the rest) and every claim stays
      unearned until its artifact is public *and* its negative result is
      written down. This is the lab programme and the real body of remaining
      work. `eval-harness` goes first: it is the artifact behind the evaluation
      claim and the only one that also generates evidence for the others.
      `from: owner · plan phase 4-5 · the point of the programme`

- [ ] **Rename `machine_checks` to `preconditions`** — 138 of 141 are prose
      conditions a human confirms; only 3 are expressible as a comparison. The
      UI label was corrected on 2026-08-15 but the JSON key still promises an
      automation that does not exist. Touches 7 course specs, `validate.py`,
      `render.py`, `types.ts` and the grading prompt, so it is one deliberate
      pass rather than something done in passing.
      `from: indie-degree · rubric audit 2026-08-15`

- [ ] **Render capabilities into `PROGRAMME.md`** — the app shows them, the
      generated Markdown does not, so the two are quietly different documents.
      `render.py` needs an areas section.
      `from: indie-degree · capability layer commit`

- [ ] **Paste-back UI for panel judgements** — designed, not built: a
      `submission` and `judgement` table holding each judge's raw response
      verbatim, owner-gated, keeping prior versions when one is replaced.
      Blocked on nothing but time.
      `from: owner · 2026-08-15`

- [ ] **Phase 2 migration, when the droplet agent schedules it** — volunteered
      to go first. Answers delivered 2026-08-15 after sitting undelivered since
      08-14. The parts that must survive into whatever gets built: pin the
      runner's Node to the droplet's exact version, and move the constructing
      ABI guard onto the droplet after rsync and before the symlink flip,
      because the artifact carries compiled binaries and builder and runtime
      must match on ABI, CPU architecture and libc.
      `from: droplet → indie-degree · INFRA.md#phase-2 · not yet scheduled`

## Declined

- [ ] ~~**An LLM that emits the final grade**~~ — declined as specified.
      Aggregating three judges is arithmetic; a model doing it reintroduces the
      single-model opinion the panel exists to avoid, with a laundering step
      that makes it look more rigorous. The counter-proposal — a fourth model
      that *diagnoses the disagreement* while the arithmetic stays
      deterministic — is open, not declined.
      `from: owner · 2026-08-15`

- [ ] ~~**A second analytics collector**~~ — standing agreement with the
      droplet agent: collection is shared across all sites and app agents build
      views on the same files.
      `from: droplet · INFRA.md#interface-contract`

- [ ] ~~**Emitting `/var/lib/usage` rows**~~ — this app makes no runtime model
      calls, so there is nothing to meter. Per `INFRA.md` that is likely the
      permanent and correct answer here, not a deferral.
      `from: droplet · INFRA.md#usage-emission`
