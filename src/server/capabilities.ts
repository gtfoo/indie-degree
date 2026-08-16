/**
 * Whether a capability claim is earned yet.
 *
 * Derived, never stored. Listing the required items under each area would
 * duplicate the skill tagging that already exists on all 297 items and would go
 * stale the moment the curriculum moved; the bar is authored, the ledger is
 * computed. Same rule the rest of the app follows: the JSON is the source of
 * truth and the database holds only what cannot be regenerated.
 *
 * The point of the whole file is the gap text. A capability page that says
 * "not met" teaches nothing; one that says "no defence item exists in the
 * programme yet" names the next piece of work.
 */

import {
  areas,
  itemKey,
  itemsOf,
  skills,
  skillsOf,
  specifiedCourses,
} from "./curriculum";
import type {
  Area,
  CapabilityStatus,
  Item,
  ProgressPayload,
  Requirement,
} from "@/products/types";

/** Every assessed item in a specified course that evidences this area. */
function itemsForArea(areaId: string): { courseId: string; item: Item }[] {
  const ids = new Set(skillsOf(areaId).map((s) => s.id));
  const out: { courseId: string; item: Item }[] = [];
  for (const course of specifiedCourses()) {
    for (const item of itemsOf(course.id)) {
      // Tier 0 is self-marked and counts toward nothing by definition.
      if (item.tier < 1) continue;
      if (!item.skills?.some((s) => ids.has(s))) continue;
      out.push({ courseId: course.id, item });
    }
  }
  return out;
}

export function capabilityStatus(
  area: Area,
  progress: ProgressPayload,
): CapabilityStatus {
  const skills = skillsOf(area.id);
  const tagged = itemsForArea(area.id);
  const bar = area.bar;

  const isComplete = (courseId: string, item: Item) =>
    progress.items[itemKey(courseId, item.id)]?.status === "complete";

  const completed = tagged.filter((t) => isComplete(t.courseId, t.item));
  const minTier = bar?.min_tier ?? 1;
  const qualifying = completed.filter((t) => t.item.tier >= minTier);

  const requirements: Requirement[] = [];

  if (bar) {
    const short = bar.min_items - qualifying.length;
    requirements.push({
      label: `${bar.min_items} assessed items at tier ${minTier} or above`,
      met: short <= 0,
      gap:
        short <= 0
          ? null
          : `${qualifying.length} of ${bar.min_items} — ${short} more to do, from ${tagged.length} available`,
    });
  }

  if (area.artifact) {
    requirements.push({
      label: `A public artifact built for this claim — ${area.artifact.name}`,
      met: area.artifact.url !== null,
      gap: area.artifact.url === null ? "Not built yet" : null,
    });
    requirements.push({
      label: "A documented negative result — where this stops working",
      met: area.artifact.negative_result !== null,
      gap:
        area.artifact.negative_result === null
          ? "Nothing recorded. A capability with no known failure boundary has not been explored."
          : null,
    });
  }

  // Defence and recall are the two a self-set bar cannot award itself, so they
  // are checked against the curriculum rather than against an assertion.
  if (bar?.defence) {
    const defences = tagged.filter((t) => t.item.tier >= 4);
    const done = defences.filter((t) => isComplete(t.courseId, t.item));
    requirements.push({
      label: "Defended aloud, against questions you did not write",
      met: done.length > 0,
      gap:
        defences.length === 0
          ? "No tier-4 item in the programme teaches this yet"
          : done.length === 0
            ? `${defences.length} available, none done`
            : null,
    });
  }

  if (bar?.cold_recall) {
    const recalls = tagged.filter((t) => t.item.type === "retention");
    const done = recalls.filter((t) => isComplete(t.courseId, t.item));
    requirements.push({
      label: "Recalled cold, a week later, without notes",
      met: done.length > 0,
      gap:
        recalls.length === 0
          ? "No retention item in the programme covers this yet"
          : done.length === 0
            ? `${recalls.length} scheduled, none done`
            : null,
    });
  }

  return {
    area,
    skills,
    assessed: tagged.length,
    completed: completed.length,
    qualifying: qualifying.length,
    requirements,
    // An area with no bar is supporting: it is never "met" because it is never
    // claimed on its own.
    met: Boolean(bar) && requirements.every((r) => r.met),
    reachable: tagged.length > 0,
  };
}

/** Assessed items that evidence one skill, with where they live. */
export function itemsForSkill(
  skillId: string,
): { courseId: string; item: Item }[] {
  const out: { courseId: string; item: Item }[] = [];
  for (const course of specifiedCourses()) {
    for (const item of itemsOf(course.id)) {
      if (item.tier < 1) continue;
      if (item.skills?.includes(skillId)) out.push({ courseId: course.id, item });
    }
  }
  return out;
}

/**
 * Assessed and completed counts for every skill in one pass, so the graph can
 * shade 75 nodes without re-walking the curriculum 75 times.
 */
export function skillEvidence(
  progress: ProgressPayload,
): Map<string, { assessed: number; completed: number }> {
  const out = new Map<string, { assessed: number; completed: number }>();
  for (const course of specifiedCourses()) {
    for (const item of itemsOf(course.id)) {
      if (item.tier < 1 || !item.skills) continue;
      const done =
        progress.items[itemKey(course.id, item.id)]?.status === "complete";
      for (const s of item.skills) {
        const row = out.get(s) ?? { assessed: 0, completed: 0 };
        row.assessed += 1;
        if (done) row.completed += 1;
        out.set(s, row);
      }
    }
  }
  return out;
}

export function allCapabilities(progress: ProgressPayload): CapabilityStatus[] {
  return areas.map((a) => capabilityStatus(a, progress));
}

export function claimable(progress: ProgressPayload): CapabilityStatus[] {
  return allCapabilities(progress).filter((c) => c.area.claimable);
}

export interface CourseCapability {
  areaId: string;
  name: string;
  claimable: boolean;
  /** Assessed items in THIS course that advance the area. */
  items: number;
  done: number;
}

/**
 * What a course is actually for, in capability terms.
 *
 * The course page used to open with "38 items, 45h", which invites the reader
 * to think about finishing a list. This answers the better question — what will
 * I be able to do — and it is derived from the same skill tags the capability
 * pages use, so the two can never disagree.
 */
export function capabilitiesOf(
  courseId: string,
  progress: ProgressPayload,
): CourseCapability[] {
  const tally = new Map<string, { items: number; done: number }>();

  for (const item of itemsOf(courseId)) {
    if (item.tier < 1 || item.optional) continue;
    const done = progress.items[itemKey(courseId, item.id)]?.status === "complete";
    const areasHit = new Set(
      (item.skills ?? [])
        .map((s) => skills.find((x) => x.id === s)?.area)
        .filter((a): a is string => Boolean(a)),
    );
    for (const a of areasHit) {
      const row = tally.get(a) ?? { items: 0, done: 0 };
      row.items += 1;
      if (done) row.done += 1;
      tally.set(a, row);
    }
  }

  return [...tally.entries()]
    .map(([areaId, row]) => {
      const area = areas.find((a) => a.id === areaId);
      return {
        areaId,
        name: area?.cv_line ?? area?.name ?? areaId,
        claimable: Boolean(area?.claimable),
        ...row,
      };
    })
    // Claimable first, then by how much of the course serves them.
    .sort(
      (a, b) => Number(b.claimable) - Number(a.claimable) || b.items - a.items,
    );
}
