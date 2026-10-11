/**
 * Calibration across the whole programme, rather than one item at a time.
 *
 * `getAssessment()` already answers "how did my scoring compare to the panel on
 * this assignment". It cannot answer the question a capability claim actually
 * rests on: **do I systematically over-rate myself, and where.** One item's gap
 * is noise. The pattern across items is the only figure in this transcript that
 * measures judgement rather than effort, and it is the thing an interview
 * exposes fastest — someone who scores themselves two levels above a panel will
 * claim skills they cannot defend.
 *
 * Nothing here invents a score. Every number is a count, or a mean of observed
 * gaps, and three things are deliberately kept out of the arithmetic:
 *
 * - **A declined criterion is excluded, never counted as agreement.** "Not
 *   verifiable from this text" is an absence of evidence; averaging it in as a
 *   zero gap would make an unjudged criterion look perfectly calibrated, which
 *   is the exact inversion of what it means.
 * - **No single headline number.** A mean gap over four criteria and a mean gap
 *   over four hundred are not the same claim, so `comparable` travels with it
 *   everywhere and the page refuses to lead with the mean until there is enough
 *   to lead with.
 * - **No trend.** Fitting a direction to a handful of items would be reading
 *   noise. The items are returned in date order and the reader can see for
 *   themselves; when there is enough evidence to support a trend, it can be
 *   computed then.
 */

import { getDb } from "./db";
import { LEARNER } from "./progress";
import { getAssessment } from "./submissions";
import { getSpec, itemsOf } from "./curriculum";
import type { Rubric } from "@/products/types";

/** One assessed item, reduced to what calibration needs. */
export interface ItemCalibration {
  key: string;
  courseId: string;
  itemId: string;
  title: string;
  tier: number;
  /** Mean signed gap over criteria the panel actually scored. */
  meanGap: number | null;
  /** Criteria with both a self score and a panel median. */
  comparable: number;
  /** Criteria at least one judge declined. */
  declined: number;
  /** Largest spread between judges on any one criterion. */
  maxSpread: number | null;
  judges: number;
  assessedAt: string | null;
}

/** A criterion where self and panel diverged most, kept with its context. */
export interface Divergence {
  key: string;
  title: string;
  criterionId: string;
  criterion: string;
  self: number;
  panel: number;
  gap: number;
}

export interface CalibrationSummary {
  /** Date order, oldest first. */
  items: ItemCalibration[];
  /** Criteria with both sides present. The denominator for everything below. */
  comparable: number;
  /** Mean signed gap. Positive means scoring yourself above the panel. */
  meanGap: number | null;
  /** Mean of |gap| — how far off, ignoring direction. */
  meanAbsGap: number | null;
  over: number;
  under: number;
  exact: number;
  /** Criteria at least one judge refused to score. Never counted as agreement. */
  declined: number;
  /** Criteria where judges disagreed by 2 or more levels. */
  disagreements: number;
  byTier: { tier: number; comparable: number; meanGap: number | null }[];
  /** Up to five criteria most over-rated, worst first. */
  overRated: Divergence[];
  /** Up to five criteria most under-rated, worst first. */
  underRated: Divergence[];
}

/** Item keys carrying at least one judgement that has not been superseded. */
export function assessedItemKeys(): string[] {
  const rows = getDb()
    .prepare(
      `SELECT DISTINCT item_key FROM judgements
        WHERE learner_id = ? AND superseded_at IS NULL
        ORDER BY item_key`,
    )
    .all(LEARNER) as { item_key: string }[];
  return rows.map((r) => r.item_key);
}

/** Split a progress key back into its parts. Course and item ids carry no slash. */
function splitKey(key: string): { courseId: string; itemId: string } | null {
  const i = key.indexOf("/");
  if (i <= 0 || i === key.length - 1) return null;
  return { courseId: key.slice(0, i), itemId: key.slice(i + 1) };
}

/** The rubric an item was judged against, or null if the item or rubric is gone. */
function rubricFor(
  courseId: string,
  itemId: string,
): { rubric: Rubric; title: string } | null {
  const spec = getSpec(courseId);
  if (!spec) return null;
  const item = itemsOf(courseId).find((i) => i.id === itemId);
  if (!item?.rubric) return null;
  const rubric = spec.rubrics.find((r) => r.id === item.rubric);
  if (!rubric) return null;
  return { rubric, title: item.title };
}

const mean = (xs: number[]): number | null =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

export function programmeCalibration(): CalibrationSummary {
  const items: ItemCalibration[] = [];
  const allGaps: number[] = [];
  const byTier = new Map<number, number[]>();
  const divergences: Divergence[] = [];
  let over = 0,
    under = 0,
    exact = 0,
    declined = 0,
    disagreements = 0;

  for (const key of assessedItemKeys()) {
    const parts = splitKey(key);
    if (!parts) continue;
    const found = rubricFor(parts.courseId, parts.itemId);
    // An item removed from the curriculum keeps its evidence in the database
    // but has nothing left to compare it against. Skipping is correct; the
    // evidence is not lost, it is simply no longer interpretable.
    if (!found) continue;

    const a = getAssessment(key, found.rubric);
    const gaps: number[] = [];

    for (const c of a.calibration) {
      declined += c.declined;
      if ((c.spread ?? 0) >= 2) disagreements += 1;
      if (c.gap === null || c.self === null || c.panel === null) continue;
      gaps.push(c.gap);
      allGaps.push(c.gap);
      if (c.gap > 0) over += 1;
      else if (c.gap < 0) under += 1;
      else exact += 1;
      if (c.gap !== 0) {
        divergences.push({
          key,
          title: found.title,
          criterionId: c.criterionId,
          criterion: c.criterion,
          self: c.self,
          panel: c.panel,
          gap: c.gap,
        });
      }
      const bucket = byTier.get(found.rubric.tier) ?? [];
      bucket.push(c.gap);
      byTier.set(found.rubric.tier, bucket);
    }

    const spreads = a.calibration
      .map((c) => c.spread)
      .filter((s): s is number => s !== null);

    items.push({
      key,
      courseId: parts.courseId,
      itemId: parts.itemId,
      title: found.title,
      tier: found.rubric.tier,
      meanGap: mean(gaps),
      comparable: gaps.length,
      declined: a.calibration.reduce((n, c) => n + c.declined, 0),
      maxSpread: spreads.length ? Math.max(...spreads) : null,
      judges: a.judgements.length,
      assessedAt:
        a.judgements.map((j) => j.pastedAt).sort().at(-1) ?? null,
    });
  }

  items.sort((x, y) => (x.assessedAt ?? "").localeCompare(y.assessedAt ?? ""));

  const byGap = [...divergences].sort((x, y) => y.gap - x.gap);

  return {
    items,
    comparable: allGaps.length,
    meanGap: mean(allGaps),
    meanAbsGap: mean(allGaps.map(Math.abs)),
    over,
    under,
    exact,
    declined,
    disagreements,
    byTier: [...byTier.entries()]
      .sort((x, y) => x[0] - y[0])
      .map(([tier, gs]) => ({ tier, comparable: gs.length, meanGap: mean(gs) })),
    overRated: byGap.filter((d) => d.gap > 0).slice(0, 5),
    underRated: byGap.filter((d) => d.gap < 0).reverse().slice(0, 5),
  };
}
