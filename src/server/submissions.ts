/**
 * The evidence loop: submission, self-assessment, panel, calibration.
 *
 * Until this existed, completing an assignment meant ticking a checkbox — the
 * transcript claimed tier-2 panel-assessed evidence and stored none of it.
 *
 * The order of operations is load-bearing and enforced here rather than left to
 * the UI:
 *
 *   1. write the submission, explaining each checkpoint
 *   2. score yourself against the rubric
 *   3. only then paste what the judges said
 *
 * Step 2 before step 3 is the whole design. Immediate feedback improves how
 * work looks now and reduces what is learned from it; scoring yourself first is
 * the desirable difficulty that turns a verdict into information. It also
 * produces the calibration gap, which is the only figure in this transcript
 * that measures judgement rather than effort.
 */

import { getDb } from "./db";
import { LEARNER } from "./progress";
import { parseScores } from "@/products/parseScores";
import type { Rubric } from "@/products/types";

export interface Submission {
  /** Keyed by checkpoint index. */
  explanations: Record<string, string>;
  artifactUrl: string | null;
  submittedAt: string | null;
  updatedAt: string;
}

export interface Judgement {
  id: number;
  judge: string;
  body: string;
  pastedAt: string;
  /** criterion id -> level, or null where the judge declined it. */
  scores: Record<string, number | null>;
}

export interface CriterionCalibration {
  criterionId: string;
  criterion: string;
  self: number | null;
  /** Median of the judges that gave this criterion a level. */
  panel: number | null;
  /** self - panel. Positive means the learner scored themselves high. */
  gap: number | null;
  /** Highest minus lowest across judges; 2 or more is a real disagreement. */
  spread: number | null;
  declined: number;
}

export interface Assessment {
  submission: Submission | null;
  selfScores: Record<string, number>;
  judgements: Judgement[];
  calibration: CriterionCalibration[];
  /** Mean signed gap. Null until both sides exist. */
  meanGap: number | null;
  /** The criterion the panel scored lowest — the feed-forward answer. */
  weakest: CriterionCalibration | null;
}

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export function getSubmission(itemKey: string): Submission | null {
  const row = getDb()
    .prepare(
      `SELECT explanations, artifact_url, submitted_at, updated_at
         FROM submissions WHERE learner_id = ? AND item_key = ?`,
    )
    .get(LEARNER, itemKey) as
    | {
        explanations: string;
        artifact_url: string | null;
        submitted_at: string | null;
        updated_at: string;
      }
    | undefined;
  if (!row) return null;
  return {
    explanations: JSON.parse(row.explanations) as Record<string, string>,
    artifactUrl: row.artifact_url,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
  };
}

export function saveSubmission(
  itemKey: string,
  explanations: Record<string, string>,
  artifactUrl: string | null,
  submit: boolean,
): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO submissions
         (learner_id, item_key, explanations, artifact_url, submitted_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (learner_id, item_key) DO UPDATE SET
         explanations = excluded.explanations,
         artifact_url = excluded.artifact_url,
         -- Submitting is one-way. A first submission timestamp that could be
         -- rewritten later would make "the rubric predates the work" unprovable.
         submitted_at = COALESCE(submissions.submitted_at, excluded.submitted_at),
         updated_at   = excluded.updated_at`,
    )
    .run(LEARNER, itemKey, JSON.stringify(explanations), artifactUrl,
         submit ? now : null, now);
}

export function saveSelfAssessment(
  itemKey: string,
  scores: Record<string, number>,
): void {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO self_assessments (learner_id, item_key, criterion_id, level, recorded_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (learner_id, item_key, criterion_id) DO UPDATE SET
       level = excluded.level, recorded_at = excluded.recorded_at`,
  );
  db.transaction(() => {
    for (const [cid, level] of Object.entries(scores)) stmt.run(LEARNER, itemKey, cid, level, now);
  })();
}

export function getSelfScores(itemKey: string): Record<string, number> {
  const rows = getDb()
    .prepare(
      `SELECT criterion_id, level FROM self_assessments
        WHERE learner_id = ? AND item_key = ?`,
    )
    .all(LEARNER, itemKey) as { criterion_id: string; level: number }[];
  return Object.fromEntries(rows.map((r) => [r.criterion_id, r.level]));
}

export class OrderError extends Error {}

/**
 * Record a judge's reply.
 *
 * Refuses if no self-assessment exists yet. That refusal is the feature: it is
 * what makes "score yourself first" a property of the system rather than a
 * discipline the learner has to maintain against the temptation to peek.
 */
export function addJudgement(
  itemKey: string,
  judge: string,
  body: string,
  rubric: Rubric,
): void {
  const db = getDb();
  if (Object.keys(getSelfScores(itemKey)).length === 0) {
    throw new OrderError(
      "Score yourself against the rubric before recording what a judge said. " +
        "Reading the verdict first is what makes the exercise feel productive " +
        "and stop teaching anything.",
    );
  }

  const now = new Date().toISOString();
  const scores = parseScores(body, rubric);

  db.transaction(() => {
    db.prepare(
      `UPDATE judgements SET superseded_at = ?
        WHERE learner_id = ? AND item_key = ? AND judge = ? AND superseded_at IS NULL`,
    ).run(now, LEARNER, itemKey, judge);

    const info = db
      .prepare(
        `INSERT INTO judgements (learner_id, item_key, judge, body, pasted_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(LEARNER, itemKey, judge, body, now);

    const stmt = db.prepare(
      `INSERT INTO judgement_scores (judgement_id, criterion_id, level) VALUES (?, ?, ?)`,
    );
    for (const [cid, level] of Object.entries(scores)) {
      stmt.run(info.lastInsertRowid, cid, level);
    }
  })();
}

export function getJudgements(itemKey: string): Judgement[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, judge, body, pasted_at FROM judgements
        WHERE learner_id = ? AND item_key = ? AND superseded_at IS NULL
        ORDER BY judge`,
    )
    .all(LEARNER, itemKey) as
    { id: number; judge: string; body: string; pasted_at: string }[];

  return rows.map((r) => {
    const s = db
      .prepare(`SELECT criterion_id, level FROM judgement_scores WHERE judgement_id = ?`)
      .all(r.id) as { criterion_id: string; level: number | null }[];
    return {
      id: r.id,
      judge: r.judge,
      body: r.body,
      pastedAt: r.pasted_at,
      scores: Object.fromEntries(s.map((x) => [x.criterion_id, x.level])),
    };
  });
}

export function getAssessment(itemKey: string, rubric: Rubric): Assessment {
  const selfScores = getSelfScores(itemKey);
  const judgements = getJudgements(itemKey);

  const calibration: CriterionCalibration[] = rubric.criteria.map((c) => {
    const given = judgements
      .map((j) => j.scores[c.id])
      .filter((x): x is number => typeof x === "number");
    const declined = judgements.filter((j) => c.id in j.scores && j.scores[c.id] === null).length;
    const panel = median(given);
    const self = selfScores[c.id] ?? null;
    return {
      criterionId: c.id,
      criterion: c.criterion,
      self,
      panel,
      gap: self !== null && panel !== null ? self - panel : null,
      spread: given.length > 1 ? Math.max(...given) - Math.min(...given) : null,
      declined,
    };
  });

  const gaps = calibration.map((c) => c.gap).filter((g): g is number => g !== null);
  const scored = calibration.filter((c) => c.panel !== null);

  return {
    submission: getSubmission(itemKey),
    selfScores,
    judgements,
    calibration,
    meanGap: gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null,
    // Feed-forward: the rubric says where you are going and the panel says how
    // you did; neither answers "where to next". The lowest-scored criterion is
    // the smallest honest answer to that question.
    weakest: scored.length
      ? scored.reduce((lo, c) => ((c.panel ?? 9) < (lo.panel ?? 9) ? c : lo))
      : null,
  };
}
