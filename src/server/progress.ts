import { getDb } from "./db";
import {
  itemKey,
  itemsOf,
  requiredItems,
  specifiedCourses,
} from "./curriculum";
import standing from "@/products/curriculum/advanced-standing.json";
import type {
  CourseProgress,
  ItemProgress,
  ItemStatus,
  ProgressPayload,
} from "@/products/types";

/**
 * One learner, by design. Progress is keyed rather than hardcoded so multi-user
 * is a later change and not a migration, but a cookie is deliberately not used:
 * clearing browser data should not destroy a year of study.
 */
export const LEARNER = "gtfoo";

const CREDITS_AWARDED_ON_ENTRY: number =
  standing.totals?.credits_awarded ?? 0;

interface ItemRow {
  item_key: string;
  status: ItemStatus;
  minutes_logged: number;
  completed_at: string | null;
}

function readItems(): Map<string, ItemProgress> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT item_key, status, minutes_logged, completed_at
         FROM item_progress WHERE learner_id = ?`,
    )
    .all(LEARNER) as ItemRow[];

  const checkpoints = db
    .prepare(
      `SELECT item_key, position FROM checkpoint_progress WHERE learner_id = ?`,
    )
    .all(LEARNER) as { item_key: string; position: number }[];

  const byItem = new Map<string, number[]>();
  for (const c of checkpoints) {
    const list = byItem.get(c.item_key) ?? [];
    list.push(c.position);
    byItem.set(c.item_key, list);
  }

  return new Map(
    rows.map((r) => [
      r.item_key,
      {
        status: r.status,
        minutes_logged: r.minutes_logged,
        checkpoints: (byItem.get(r.item_key) ?? []).sort((a, b) => a - b),
        completed_at: r.completed_at,
      },
    ]),
  );
}

/** Hours per week, measured from what was logged rather than intended. */
function velocity(): { weekly: number | null; spanWeeks: number } {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT MIN(logged_at) AS first, SUM(minutes) AS mins
         FROM study_sessions WHERE learner_id = ?`,
    )
    .get(LEARNER) as { first: string | null; mins: number | null };

  if (!row.first || !row.mins) return { weekly: null, spanWeeks: 0 };

  const days = (Date.now() - new Date(row.first).getTime()) / 86_400_000;
  const spanWeeks = Math.max(days / 7, 0);
  // Under two weeks of history, any rate is an artefact of a single sitting.
  if (spanWeeks < 2) return { weekly: null, spanWeeks };
  return { weekly: row.mins / 60 / spanWeeks, spanWeeks };
}

export function getProgress(): ProgressPayload {
  const items = readItems();
  const courses: Record<string, CourseProgress> = {};

  let itemsComplete = 0;
  let evidenceComplete = 0;
  let evidenceAvailable = 0;
  let artifactsShipped = 0;
  let defended = 0;
  let creditsEarned = CREDITS_AWARDED_ON_ENTRY;
  let creditsAvailable = 0;
  let requiredMinutesRemaining = 0;

  for (const course of specifiedCourses()) {
    creditsAvailable += course.credits;
    const required = requiredItems(course.id);
    let completeItems = 0;
    let completeMinutes = 0;
    let minutesLogged = 0;
    let requiredMinutes = 0;

    let exposureItems = 0;
    let exposureComplete = 0;
    let evidenceItems = 0;
    let courseEvidenceComplete = 0;

    for (const item of itemsOf(course.id)) {
      const p = items.get(itemKey(course.id, item.id));
      if (p) minutesLogged += p.minutes_logged;
      if (item.optional) continue;
      requiredMinutes += item.est_minutes;

      // Tier 0 counts toward nothing by the programme's own definition, so it
      // is counted separately rather than blended into one bar.
      const isEvidence = item.tier > 0;
      if (isEvidence) evidenceItems += 1;
      else exposureItems += 1;

      if (p?.status === "complete") {
        completeItems += 1;
        completeMinutes += item.est_minutes;
        if (isEvidence) {
          courseEvidenceComplete += 1;
          if (item.tier >= 3) artifactsShipped += 1;
          if (item.tier >= 4) defended += 1;
        } else {
          exposureComplete += 1;
        }
      }
    }
    evidenceAvailable += evidenceItems;
    evidenceComplete += courseEvidenceComplete;

    itemsComplete += completeItems;
    const earned = required.length > 0 && completeItems === required.length;
    if (earned) creditsEarned += course.credits;
    else requiredMinutesRemaining += requiredMinutes - completeMinutes;

    courses[course.id] = {
      courseId: course.id,
      requiredItems: required.length,
      completeItems,
      exposureItems,
      exposureComplete,
      evidenceItems,
      evidenceComplete: courseEvidenceComplete,
      requiredMinutes,
      completeMinutes,
      minutesLogged,
      earned,
    };
  }

  const db = getDb();
  const totals = db
    .prepare(
      `SELECT SUM(minutes) AS mins, MAX(logged_at) AS last
         FROM study_sessions WHERE learner_id = ?`,
    )
    .get(LEARNER) as { mins: number | null; last: string | null };

  const { weekly } = velocity();
  const remainingHours = requiredMinutesRemaining / 60;

  return {
    banked: {
      itemsComplete,
      evidenceComplete,
      evidenceAvailable,
      artifactsShipped,
      defended,
      hoursLogged: Math.round(((totals.mins ?? 0) / 60) * 10) / 10,
      creditsEarned,
      creditsAvailable: creditsAvailable + CREDITS_AWARDED_ON_ENTRY,
      requiredHoursRemaining: Math.round(remainingHours),
      weeklyHours: weekly === null ? null : Math.round(weekly * 10) / 10,
      // A band, not a statistical interval — said plainly in the UI.
      projection:
        weekly && weekly > 0
          ? {
              fastWeeks: Math.ceil(remainingHours / (weekly * 1.5)),
              slowWeeks: Math.ceil(remainingHours / (weekly * 0.6)),
            }
          : null,
      lastActivity: totals.last,
    },
    courses,
    items: Object.fromEntries(items),
  };
}

export function setItemStatus(
  key: string,
  status: ItemStatus,
  minutes: number,
): void {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = db
    .prepare(
      `SELECT status, minutes_logged FROM item_progress
        WHERE learner_id = ? AND item_key = ?`,
    )
    .get(LEARNER, key) as
    | { status: ItemStatus; minutes_logged: number }
    | undefined;

  // Hours are banked the first time an item is ever completed, and never
  // again. Guarding on the previous *status* is not enough: unticking and
  // reticking would bank the same sitting twice, which is exactly the kind of
  // silently inflating number this system is supposed to refuse.
  const shouldLog =
    status === "complete" && (existing?.minutes_logged ?? 0) === 0 && minutes > 0;

  db.prepare(
    `INSERT INTO item_progress
       (learner_id, item_key, status, minutes_logged, started_at, completed_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (learner_id, item_key) DO UPDATE SET
       status = excluded.status,
       minutes_logged = item_progress.minutes_logged + excluded.minutes_logged,
       completed_at = excluded.completed_at,
       updated_at = excluded.updated_at`,
  ).run(
    LEARNER,
    key,
    status,
    shouldLog ? minutes : 0,
    now,
    status === "complete" ? now : null,
    now,
  );

  if (shouldLog) {
    db.prepare(
      `INSERT INTO study_sessions (learner_id, item_key, minutes, logged_at)
       VALUES (?, ?, ?, ?)`,
    ).run(LEARNER, key, minutes, now);
  }
}

export function toggleCheckpoint(key: string, position: number): void {
  const db = getDb();
  const has = db
    .prepare(
      `SELECT 1 FROM checkpoint_progress
        WHERE learner_id = ? AND item_key = ? AND position = ?`,
    )
    .get(LEARNER, key, position);

  if (has) {
    db.prepare(
      `DELETE FROM checkpoint_progress
        WHERE learner_id = ? AND item_key = ? AND position = ?`,
    ).run(LEARNER, key, position);
    return;
  }

  db.prepare(
    `INSERT INTO checkpoint_progress (learner_id, item_key, position, reached_at)
     VALUES (?, ?, ?, ?)`,
  ).run(LEARNER, key, position, new Date().toISOString());

  // Reaching a checkpoint means work started, even if nothing was marked.
  db.prepare(
    `INSERT INTO item_progress (learner_id, item_key, status, started_at, updated_at)
     VALUES (?, ?, 'in_progress', ?, ?)
     ON CONFLICT (learner_id, item_key) DO UPDATE SET
       status = CASE WHEN item_progress.status = 'not_started'
                     THEN 'in_progress' ELSE item_progress.status END,
       updated_at = excluded.updated_at`,
  ).run(LEARNER, key, new Date().toISOString(), new Date().toISOString());
}

/**
 * The next thing to do. This is the cold-start answer: after a month away the
 * question is never "where was I" but "what is one thing I can pick up now".
 */
export function nextItem(): { courseId: string; itemId: string } | null {
  const items = readItems();
  for (const course of specifiedCourses()) {
    for (const item of itemsOf(course.id)) {
      if (item.optional) continue;
      const p = items.get(itemKey(course.id, item.id));
      if (p?.status === "in_progress") return { courseId: course.id, itemId: item.id };
    }
  }
  for (const course of specifiedCourses()) {
    for (const item of itemsOf(course.id)) {
      if (item.optional) continue;
      const p = items.get(itemKey(course.id, item.id));
      if (!p || p.status === "not_started") {
        return { courseId: course.id, itemId: item.id };
      }
    }
  }
  return null;
}
