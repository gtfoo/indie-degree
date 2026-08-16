import type { Rubric } from "./types";

/**
 * Pull per-criterion levels out of a judge's reply.
 *
 * Pure, and kept out of the database layer so it can be tested without one —
 * this is the piece most likely to be quietly wrong, because it is the only
 * place where free text from a model becomes a number in a transcript.
 *
 * Parses the SCORES block the grading prompt asks for, and falls back to
 * scanning the whole reply when a model wanders off format, which they do.
 *
 * The one distinction that must survive: a criterion the judge declined is
 * recorded as null and must never become a zero. "I cannot verify this from
 * the text" and "this is worthless" are opposite statements, and 45 of the
 * criteria in this programme depend on evidence a pasted submission cannot
 * contain, so declining is a common and correct answer.
 */
export function parseScores(
  body: string,
  rubric: Rubric,
): Record<string, number | null> {
  const ids = new Set(rubric.criteria.map((c) => c.id));
  const out: Record<string, number | null> = {};

  // Everything after the last SCORES header, so a model that echoes the
  // template earlier in its reasoning does not win over its real answer.
  const parts = body.split(/^[ \t]*SCORES[ \t]*:?[ \t]*$/im);
  const block = parts.length > 1 ? parts[parts.length - 1] : body;

  for (const raw of block.split("\n")) {
    const m = raw.match(/^\s*[-*]?\s*\[?([A-Za-z0-9_-]+)\]?\s*[:=]\s*(.+?)\s*$/);
    if (!m) continue;
    const [, id, value] = m;
    if (!ids.has(id) || id in out) continue;
    // A bare 0-3 is a level. Anything else - "not verifiable", "n/a", prose -
    // is a decline. Requiring the digit at the start stops "level 2 would be
    // wrong here" from scoring 2.
    const digit = value.match(/^["'`]?([0-3])(?![0-9])/);
    out[id] = digit ? Number(digit[1]) : null;
  }
  return out;
}
