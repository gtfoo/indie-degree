/**
 * Scoring a run, reporting it by tag, and comparing it to a baseline.
 *
 * The rule this file exists to enforce: **never report a bare aggregate.** One
 * number across a whole corpus is how a regression hides — a system that gets
 * 8% better at the easy tag and 30% worse at the one that matters reads as
 * "slightly improved". Every report is per-tag first, and the overall figure is
 * printed last and labelled as what it is.
 */

import type { Case, Output } from "./case.ts";
import { negativeCount } from "./case.ts";
import { score, type Score } from "./scorers.ts";

export interface Scored {
  case_id: string;
  tags: string[];
  score: number;
  detail: string;
  /** True when the run had no output at all for this case. */
  missing: boolean;
}

export interface TagRow {
  tag: string;
  n: number;
  mean: number;
  /** Cases scoring a full 1. Partial credit is not a pass. */
  passed: number;
}

export interface Report {
  scored: Scored[];
  tags: TagRow[];
  overall: number;
  cases: number;
  negatives: number;
  missing: number;
}

export function scoreRun(cases: Case[], outputs: Output[]): Report {
  const byId = new Map(outputs.map((o) => [o.case_id, o]));
  const scored: Scored[] = cases.map((c) => {
    const o = byId.get(c.id);
    if (!o) {
      // A missing output scores zero rather than being skipped. Skipping lets a
      // run that silently dropped half the corpus report a better average than
      // one that attempted everything.
      return {
        case_id: c.id,
        tags: c.tags,
        score: 0,
        detail: "no output in the run",
        missing: true,
      };
    }
    const s: Score = score(c, o.output);
    return { case_id: c.id, tags: c.tags, ...s, missing: false };
  });

  const tagMap = new Map<string, number[]>();
  for (const s of scored) {
    for (const t of s.tags) {
      const list = tagMap.get(t) ?? [];
      list.push(s.score);
      tagMap.set(t, list);
    }
  }

  const tags: TagRow[] = [...tagMap.entries()]
    .map(([tag, scores]) => ({
      tag,
      n: scores.length,
      mean: scores.reduce((a, b) => a + b, 0) / scores.length,
      passed: scores.filter((x) => x === 1).length,
    }))
    .sort((a, b) => a.mean - b.mean || a.tag.localeCompare(b.tag));

  return {
    scored,
    tags,
    overall: scored.length
      ? scored.reduce((a, b) => a + b.score, 0) / scored.length
      : 0,
    cases: cases.length,
    negatives: negativeCount(cases),
    missing: scored.filter((s) => s.missing).length,
  };
}

export interface Regression {
  kind: "case" | "tag";
  name: string;
  before: number;
  after: number;
}

/**
 * Per-case regressions are the sharp signal and are checked first: a case that
 * scored 1 and now scores less is a fact, not a trend, and no amount of
 * improvement elsewhere excuses it. Tag means are checked too, because a
 * corpus can get worse in aggregate without any single case flipping.
 */
export function compare(
  baseline: Report,
  current: Report,
  tolerance = 0,
): Regression[] {
  const out: Regression[] = [];

  const before = new Map(baseline.scored.map((s) => [s.case_id, s.score]));
  for (const s of current.scored) {
    const was = before.get(s.case_id);
    if (was === undefined) continue; // new case, nothing to regress from
    if (s.score < was - tolerance) {
      out.push({ kind: "case", name: s.case_id, before: was, after: s.score });
    }
  }

  const tagBefore = new Map(baseline.tags.map((t) => [t.tag, t.mean]));
  for (const t of current.tags) {
    const was = tagBefore.get(t.tag);
    if (was === undefined) continue;
    if (t.mean < was - tolerance) {
      out.push({ kind: "tag", name: t.tag, before: was, after: t.mean });
    }
  }

  return out;
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export function format(r: Report, showFailures = true): string {
  const lines: string[] = [];
  const width = Math.max(12, ...r.tags.map((t) => t.tag.length));

  lines.push(`${r.cases} cases · ${r.negatives} negatives`);
  if (r.negatives === 0) {
    lines.push(
      "  warning: no negative cases. A corpus that never asks the system to",
    );
    lines.push(
      "  abstain cannot detect a system that answers everything confidently.",
    );
  }
  if (r.missing > 0) {
    lines.push(`  warning: ${r.missing} cases had no output and scored zero`);
  }

  lines.push("");
  lines.push(`  ${"tag".padEnd(width)}   n   passed    mean`);
  for (const t of r.tags) {
    lines.push(
      `  ${t.tag.padEnd(width)} ${String(t.n).padStart(3)} ` +
        `${`${t.passed}/${t.n}`.padStart(8)} ${pct(t.mean).padStart(7)}`,
    );
  }

  if (showFailures) {
    const failed = r.scored.filter((s) => s.score < 1);
    if (failed.length) {
      lines.push("");
      lines.push(`  ${failed.length} cases below full marks:`);
      for (const f of failed.slice(0, 20)) {
        lines.push(`    ${f.case_id}  ${pct(f.score).padStart(6)}  ${f.detail}`);
      }
      if (failed.length > 20) {
        lines.push(`    … and ${failed.length - 20} more`);
      }
    }
  }

  lines.push("");
  lines.push(`  overall ${pct(r.overall)} — read the tags above, not this line`);
  return lines.join("\n");
}

export function formatRegressions(regs: Regression[]): string {
  const lines = [`${regs.length} regressions against the baseline:`];
  for (const r of regs) {
    lines.push(
      `  ${r.kind.padEnd(4)} ${r.name}  ${pct(r.before)} → ${pct(r.after)}`,
    );
  }
  return lines.join("\n");
}
