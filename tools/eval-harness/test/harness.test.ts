import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCases, parseOutputs, CorpusError } from "../src/case.ts";
import { score } from "../src/scorers.ts";
import { scoreRun, compare } from "../src/report.ts";
import type { Case } from "../src/case.ts";

const mk = (over: Partial<Case> = {}): Case => ({
  id: "c1",
  app: "demo",
  input: { document: "We need five years of Python and a security clearance." },
  expected: "five years of Python",
  scorer: "span",
  tags: ["demo"],
  ...over,
});

test("a negative case is only satisfied by abstaining", () => {
  const c = mk({ expected: null, scorer: "absent" });
  assert.equal(score(c, null).score, 1);
  assert.equal(score(c, "").score, 1);
  assert.equal(score(c, "none").score, 1);
  assert.equal(score(c, []).score, 1);
  // The failure that matters: a confident answer where there is nothing.
  const wrong = score(c, "five years of Python");
  assert.equal(wrong.score, 0);
  assert.match(wrong.detail, /false positive/);
});

test("abstaining on a positive case scores zero", () => {
  assert.equal(score(mk(), null).score, 0);
  assert.match(score(mk(), "").detail, /abstained/);
});

test("span distinguishes fabrication from a retrieval miss", () => {
  const fabricated = score(mk(), "ten years of Rust");
  assert.equal(fabricated.score, 0);
  assert.match(fabricated.detail, /not verbatim/);

  const wrongPart = score(mk(), "a security clearance");
  assert.equal(wrongPart.score, 0);
  assert.match(wrongPart.detail, /wrong span/);

  assert.equal(score(mk(), "five years of Python").score, 1);
});

test("set_f1 gives partial credit, and only where it means something", () => {
  const c = mk({ scorer: "set_f1", expected: ["a", "b", "c"] });
  assert.equal(score(c, ["a", "b", "c"]).score, 1);
  assert.equal(score(c, ["a", "b", "c", "d"]).score.toFixed(3), "0.857");
  assert.equal(score(c, ["x", "y"]).score, 0);
});

test("numeric honours its tolerance", () => {
  const c = mk({ scorer: "numeric", expected: 100, tolerance: 5 });
  assert.equal(score(c, 103).score, 1);
  assert.equal(score(c, 106).score, 0);
  assert.equal(score(c, "not a number").score, 0);
});

test("a corpus refuses a span that is not in its own document", () => {
  assert.throws(
    () => parseCases(JSON.stringify(mk({ expected: "ten years of Rust" }))),
    (e: Error) => e instanceof CorpusError && /literal substring/.test(e.message),
  );
});

test("a corpus refuses untagged cases and duplicate ids", () => {
  assert.throws(
    () => parseCases(JSON.stringify(mk({ tags: [] }))),
    /no tags/,
  );
  const two = [JSON.stringify(mk()), JSON.stringify(mk())].join("\n");
  assert.throws(() => parseCases(two), /duplicate case id/);
});

test("a run cannot answer the same case twice", () => {
  const rows = [
    JSON.stringify({ case_id: "c1", output: "a" }),
    JSON.stringify({ case_id: "c1", output: "b" }),
  ].join("\n");
  assert.throws(() => parseOutputs(rows), /two outputs/);
});

test("a missing output scores zero rather than being skipped", () => {
  // Otherwise a run that dropped half the corpus reports a better average than
  // one that attempted everything.
  const cases = [mk({ id: "a" }), mk({ id: "b" })];
  const r = scoreRun(cases, [{ case_id: "a", output: "five years of Python" }]);
  assert.equal(r.overall, 0.5);
  assert.equal(r.missing, 1);
});

test("the report is per tag, and tags surface a hidden regression", () => {
  const cases = [
    mk({ id: "e1", tags: ["easy"] }),
    mk({ id: "e2", tags: ["easy"] }),
    mk({ id: "h1", tags: ["hard"] }),
  ];
  const before = scoreRun(cases, [
    { case_id: "e1", output: "five years of Python" },
    { case_id: "e2", output: null },
    { case_id: "h1", output: "five years of Python" },
  ]);
  const after = scoreRun(cases, [
    { case_id: "e1", output: "five years of Python" },
    { case_id: "e2", output: "five years of Python" },
    { case_id: "h1", output: "a security clearance" },
  ]);

  // The aggregate is identical, so a single number would report "no change".
  assert.equal(before.overall, after.overall);

  const regs = compare(before, after);
  assert.ok(regs.some((r) => r.kind === "case" && r.name === "h1"));
  assert.ok(regs.some((r) => r.kind === "tag" && r.name === "hard"));
});

test("a new case cannot count as a regression", () => {
  const before = scoreRun([mk({ id: "a" })], [{ case_id: "a", output: "five years of Python" }]);
  const after = scoreRun(
    [mk({ id: "a" }), mk({ id: "b" })],
    [{ case_id: "a", output: "five years of Python" }, { case_id: "b", output: null }],
  );
  assert.equal(compare(before, after).filter((r) => r.kind === "case").length, 0);
});
