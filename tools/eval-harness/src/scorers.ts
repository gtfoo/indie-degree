/**
 * Deterministic scorers.
 *
 * Deliberately no LLM judge in this file. Every scorer here is reproducible,
 * free, and gives the same answer next year — which is what makes a regression
 * signal trustworthy. A judge that drifts turns "the code got worse" and "the
 * vendor shipped a new checkpoint" into the same number, and you cannot tell
 * them apart afterwards.
 *
 * Scores are 0..1. Partial credit exists only where it means something
 * (set_f1); everywhere else a score is 0 or 1, because "mostly the right span"
 * is not a thing an extraction system can be trusted on.
 */

import type { Case } from "./case.ts";

export interface Score {
  score: number;
  /** Why, in the reader's terms. Shown for every failure. */
  detail: string;
}

/** Whitespace and case are formatting, not substance. */
function norm(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * What counts as a system saying "there is nothing here". Accepting a few
 * spellings is deliberate: the alternative is a corpus that fails because a
 * model wrote "none" where the harness wanted null, which measures phrasing
 * rather than judgement.
 */
const ABSENT_WORDS = new Set([
  "",
  "none",
  "null",
  "no evidence",
  "no evidence found",
  "not found",
  "n/a",
  "no",
]);

export function isAbsent(output: unknown): boolean {
  if (output === null || output === undefined) return true;
  if (Array.isArray(output)) return output.length === 0;
  if (typeof output === "string") return ABSENT_WORDS.has(norm(output));
  return false;
}

function asStrings(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  return typeof v === "string" ? [v] : [];
}

export function score(c: Case, output: unknown): Score {
  // A negative case is scored the same way whatever the declared scorer: the
  // only correct behaviour is to abstain. Checking this first means a corpus
  // author cannot accidentally give a system credit for a confident wrong
  // answer by picking a lenient scorer.
  if (c.expected === null) {
    return isAbsent(output)
      ? { score: 1, detail: "correctly found nothing" }
      : {
          score: 0,
          detail: `claimed ${JSON.stringify(output)} where there is nothing — a false positive`,
        };
  }

  if (isAbsent(output)) {
    return { score: 0, detail: "abstained where there is a correct answer" };
  }

  switch (c.scorer) {
    case "exact": {
      const ok = norm(String(output)) === norm(String(c.expected));
      return {
        score: ok ? 1 : 0,
        detail: ok ? "exact match" : `got ${JSON.stringify(output)}`,
      };
    }

    case "substring": {
      const ok = norm(String(output)).includes(norm(String(c.expected)));
      return {
        score: ok ? 1 : 0,
        detail: ok ? "contains the expected text" : `missing: ${String(c.expected)}`,
      };
    }

    case "span": {
      const doc = String(c.input.document ?? "");
      const got = String(output);
      // Two separate failures worth telling apart: quoting something the
      // document does not contain (fabrication) versus quoting the wrong part
      // of it (a retrieval miss).
      if (!doc.includes(got)) {
        return {
          score: 0,
          detail: "span is not verbatim in the document — fabricated",
        };
      }
      const ok = norm(got) === norm(String(c.expected));
      return {
        score: ok ? 1 : 0,
        detail: ok ? "correct span" : `wrong span: ${got.slice(0, 60)}`,
      };
    }

    case "set_f1": {
      const want = new Set(asStrings(c.expected).map(norm));
      const got = new Set(asStrings(output).map(norm));
      if (want.size === 0 && got.size === 0) return { score: 1, detail: "both empty" };
      let hit = 0;
      for (const g of got) if (want.has(g)) hit += 1;
      const precision = got.size ? hit / got.size : 0;
      const recall = want.size ? hit / want.size : 0;
      const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
      return {
        score: f1,
        detail: `p=${precision.toFixed(2)} r=${recall.toFixed(2)} f1=${f1.toFixed(2)}`,
      };
    }

    case "numeric": {
      const want = Number(c.expected);
      const got = Number(output);
      if (Number.isNaN(got)) return { score: 0, detail: `not a number: ${String(output)}` };
      const tol = c.tolerance ?? 0;
      const ok = Math.abs(got - want) <= tol;
      return {
        score: ok ? 1 : 0,
        detail: ok ? `within ${tol}` : `${got} vs ${want} (tolerance ${tol})`,
      };
    }

    case "absent":
      // Unreachable: an absent case must have expected null, which the branch
      // at the top already handled, and case.ts refuses any other shape.
      return { score: 0, detail: "absent scorer with a non-null expected" };
  }
}
