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

- [ ] **Paste-back UI for panel judgements** — designed, not built: a
      `submission` and `judgement` table holding each judge's raw response
      verbatim, owner-gated, keeping prior versions when one is replaced.
      Blocked on nothing but time.
      `from: owner · 2026-08-15`

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

## Declined

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
