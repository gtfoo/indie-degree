# eval-harness

A small evaluation harness for LLM systems. It scores **stored outputs** against
a corpus, reports **per tag**, and **exits non-zero when something regresses**.

Zero runtime dependencies. Node 22+, TypeScript with no build step.

It lives inside the Indie Degree repo but shares nothing with the app — no
imports either way, its own `tsconfig.json`, its own `package.json` for the one
field that declares it ESM. Run it from the repository root:

```bash
npm run eval -- validate --cases <corpus>/cases.jsonl
npm run eval -- baseline --cases <corpus>/cases.jsonl --run runs/v1.jsonl --out baseline.json
npm run eval -- score    --cases <corpus>/cases.jsonl --run runs/v2.jsonl --baseline baseline.json
```

## Three decisions, and why

**It never calls a model.** `score` reads a run file. Producing that file is the
job of the app that owns the system under test; scoring it is this tool's job,
and keeping the two apart is what makes a score reproducible and free. If the
harness called the model, then "my code got worse" and "the vendor shipped a new
checkpoint" would produce the same number and you could not tell them apart
afterwards. A live runner belongs upstream, and its output is a run file.

**It never reports a bare aggregate.** Tags come first and the overall figure is
printed last, labelled as something not to read. A system that gets 8% better at
the easy tag and 30% worse at the one that matters shows up as "slightly
improved" in a single number. The fixture in this repo demonstrates it: a naive
extractor that always finds something scores **93.8% on positives, 0% on
negatives, 46.9% overall** — and the overall figure is the least useful of the
three.

**Negatives are first class.** A case whose correct answer is "there is nothing
here" is scored by abstention, whatever scorer it declares, so a corpus author
cannot accidentally hand a system credit for a confident wrong answer by picking
something lenient. `validate` counts negatives and warns at zero, because a set
that never asks a system to abstain cannot detect one that answers everything.

## Corpus format

One JSON object per line. `//` lines are ignored, so a corpus can carry its own
reasoning next to the cases.

```json
{"id":"pos-01","app":"csq","scorer":"span","tags":["positive","explicit"],
 "input":{"document":"…Requirements: 5+ years of Python…","requirement":"Python experience"},
 "expected":"5+ years of Python","source":"trace 2026-08-11"}
```

- `expected: null` means the correct answer is nothing.
- `tags` is required. An untagged case can only appear in the aggregate, which
  is the number that hides regressions.
- `source` records the trace, bug or decision the case came from. The cases
  worth keeping are usually the ones that came from something that broke.

**A `span` case is checked against its own document at load time.** If the
expected span is not a literal substring of `input.document`, the corpus is
rejected — the gold set has to obey the same verbatim-evidence rule the system
under test does.

### Scorers

| scorer | what it means |
|---|---|
| `exact` | normalised string equality |
| `substring` | expected text appears in the output |
| `span` | verbatim quote from `input.document`, and the right one |
| `set_f1` | precision/recall over a set — the only partial credit here |
| `numeric` | within `tolerance` |
| `absent` | the answer is nothing |

`span` distinguishes two failures that matter separately: quoting text the
document does not contain (fabrication) and quoting the wrong part of it (a
retrieval miss).

## Regressions

`compare` checks per case first and per tag second. A case that scored 1 and now
scores less is a fact, not a trend, and no improvement elsewhere excuses it. Tag
means are checked too, since a corpus can get worse in aggregate without any
single case flipping. New cases can never count as regressions.

Exit codes: **0** clean · **1** regression · **2** usage or corpus error.

A missing output scores zero rather than being skipped — otherwise a run that
silently dropped half the corpus reports a better average than one that
attempted everything.

## The fixture

`corpora/fixture-evidence-extraction/` is eight cases whose only job is to
exercise the harness and show the format. **It is not a gold set** and is
deliberately too small and too easy to measure anything.

Typecheck and tests, also run as part of the repo's `npm run check`:

```bash
npm run check:eval
```

Score the naive run against the strong baseline — prints the split above and
exits 1:

```bash
npm run eval -- score --cases tools/eval-harness/corpora/fixture-evidence-extraction/cases.jsonl --run tools/eval-harness/corpora/fixture-evidence-extraction/runs/naive.jsonl --baseline tools/eval-harness/corpora/fixture-evidence-extraction/baseline.json
```

The 30-case gold set this is waiting for is Indie Degree's AIE-102 M2.5 — the
learner's assignment. An agent writing it would destroy the only thing it is
for, so it is deliberately absent.

## Status

Built 2026-08-15 as the artifact behind the *LLM evaluation* capability claim in
[Indie Degree](https://indie-degree.gtfoo.com/capabilities/evaluation). That
claim is not earned until this harness runs against a real corpus and a
documented negative result exists — somewhere the approach measurably stops
working. Neither is true yet, and the capability page says so.
