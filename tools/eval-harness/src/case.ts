/**
 * A case, and the rules for reading a corpus.
 *
 * JSONL rather than JSON: a corpus grows one line at a time, and a one-line-per
 * -case file gives readable diffs when a case is added and a merge conflict you
 * can actually resolve. A 30-case array reformatted by an editor is a diff
 * nobody reviews.
 */

export type ScorerName =
  | "exact"
  | "substring"
  | "span"
  | "set_f1"
  | "numeric"
  | "absent";

export interface Case {
  id: string;
  /** Which system this case exercises. Kept so one corpus can span apps. */
  app: string;
  input: Record<string, unknown>;
  /** Null means the correct answer is "there is nothing here". */
  expected: unknown;
  scorer: ScorerName;
  tags: string[];
  /**
   * The trace, bug or decision this case came from. A case with no provenance
   * is a case nobody can argue with later — and the ones worth keeping are
   * usually the ones that came from something that actually broke.
   */
  source?: string;
  /** Tolerance for the numeric scorer. */
  tolerance?: number;
}

/** One system output for one case. Replay reads these; it never calls a model. */
export interface Output {
  case_id: string;
  output: unknown;
  /** Optional, purely informational — not scored. */
  meta?: Record<string, unknown>;
}

const SCORERS = new Set<string>([
  "exact",
  "substring",
  "span",
  "set_f1",
  "numeric",
  "absent",
]);

export class CorpusError extends Error {}

function parseLines<T>(text: string, what: string): T[] {
  const out: T[] = [];
  text.split("\n").forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    try {
      out.push(JSON.parse(trimmed) as T);
    } catch (err) {
      throw new CorpusError(
        `${what} line ${i + 1} is not valid JSON: ${(err as Error).message}`,
      );
    }
  });
  return out;
}

export function parseCases(text: string): Case[] {
  const cases = parseLines<Case>(text, "cases");
  const seen = new Set<string>();

  for (const c of cases) {
    if (!c.id) throw new CorpusError(`a case has no id`);
    if (seen.has(c.id)) throw new CorpusError(`duplicate case id ${c.id}`);
    seen.add(c.id);
    if (!SCORERS.has(c.scorer)) {
      throw new CorpusError(`case ${c.id}: unknown scorer ${String(c.scorer)}`);
    }
    if (!Array.isArray(c.tags) || c.tags.length === 0) {
      throw new CorpusError(
        `case ${c.id}: no tags — an untagged case can only ever appear in the ` +
          `aggregate, which is the number that hides regressions`,
      );
    }
    // A span must actually be present in the document it claims to come from,
    // or the gold set is asserting something the source does not support. This
    // is the same verbatim-evidence rule the system under test has to obey.
    if (c.scorer === "span" && c.expected !== null) {
      const doc = c.input?.document;
      if (typeof doc !== "string") {
        throw new CorpusError(`case ${c.id}: span scorer needs input.document`);
      }
      if (typeof c.expected !== "string" || !doc.includes(c.expected)) {
        throw new CorpusError(
          `case ${c.id}: expected span is not a literal substring of the document`,
        );
      }
    }
    if (c.scorer === "absent" && c.expected !== null) {
      throw new CorpusError(
        `case ${c.id}: the absent scorer means "nothing is here", so expected ` +
          `must be null`,
      );
    }
  }
  return cases;
}

export function parseOutputs(text: string): Output[] {
  const outputs = parseLines<Output>(text, "run");
  const seen = new Set<string>();
  for (const o of outputs) {
    if (!o.case_id) throw new CorpusError("a run row has no case_id");
    if (seen.has(o.case_id)) {
      throw new CorpusError(`run has two outputs for case ${o.case_id}`);
    }
    seen.add(o.case_id);
  }
  return outputs;
}

/**
 * A corpus with no negatives measures nothing: a system that answers
 * everything confidently scores full marks on a set that never asks it to
 * abstain. Reported rather than enforced, since the right floor depends on the
 * task — but reported every time, so it cannot be quietly forgotten.
 */
export function negativeCount(cases: Case[]): number {
  return cases.filter((c) => c.expected === null).length;
}
