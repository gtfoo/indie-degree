import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

let db: Database.Database | null = null;

/**
 * Learner state only. The curriculum lives in JSON (see curriculum.ts) and is
 * regenerated freely; everything in here is the record of work actually done
 * and must survive any change to the courses.
 *
 * Note the deliberate absence of a streak: on an irregular schedule a broken
 * streak reads as failure and stops you opening the app. Everything recorded
 * here only ever goes up.
 */
export function getDb(): Database.Database {
  if (db) return db;

  /**
   * The database lives OUTSIDE the app tree, at a path supplied by the
   * environment. Deliberately no fallback.
   *
   * A default pointing inside the tree is the failure this whole convention
   * exists to prevent: SQLite would happily create an empty file there, the app
   * would boot, report healthy, and serve an empty transcript — while the real
   * database sat untouched somewhere else. Silent, and indistinguishable from
   * "no progress yet". A standalone server also chdirs into `.next/standalone`,
   * so any relative default would be wrong in production anyway.
   *
   * Throwing here is loud, immediate, and says exactly what to set.
   */
  const dir = process.env.DATA_DIR;
  if (!dir) {
    throw new Error(
      "DATA_DIR is not set. It must point at a writable directory OUTSIDE the " +
        "app tree — /home/deploy/indie-degree-data in production, or anything " +
        "you like locally. Refusing to guess: a guessed path creates an empty " +
        "database that looks like an empty transcript.",
    );
  }
  mkdirSync(dir, { recursive: true });

  db = new Database(join(dir, "indie-degree.sqlite"));
  db.pragma("journal_mode = WAL");

  db.exec(`
    -- Sign-in. There is exactly one account here — the owner named by
    -- OWNER_EMAIL — because reading is public and writing is not. The table
    -- exists because Auth.js needs somewhere to put the row, not because the
    -- app has users.
    CREATE TABLE IF NOT EXISTS users (
      id             TEXT PRIMARY KEY,
      email          TEXT UNIQUE,
      name           TEXT,
      image          TEXT,
      email_verified TEXT,
      created_at     TEXT NOT NULL
    );

    -- Magic-link tokens. Consumed on use, inside a transaction, so a link
    -- cannot be replayed even if the email is forwarded.
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token      TEXT NOT NULL,
      expires    TEXT NOT NULL,
      PRIMARY KEY (identifier, token)
    );

    CREATE TABLE IF NOT EXISTS item_progress (
      learner_id     TEXT    NOT NULL,
      item_key       TEXT    NOT NULL,
      status         TEXT    NOT NULL DEFAULT 'not_started',
      minutes_logged INTEGER NOT NULL DEFAULT 0,
      started_at     TEXT,
      completed_at   TEXT,
      updated_at     TEXT    NOT NULL,
      PRIMARY KEY (learner_id, item_key)
    );

    CREATE TABLE IF NOT EXISTS checkpoint_progress (
      learner_id TEXT    NOT NULL,
      item_key   TEXT    NOT NULL,
      position   INTEGER NOT NULL,
      reached_at TEXT    NOT NULL,
      PRIMARY KEY (learner_id, item_key, position)
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      learner_id TEXT    NOT NULL,
      item_key   TEXT    NOT NULL,
      minutes    INTEGER NOT NULL,
      logged_at  TEXT    NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_mq_sessions_learner_time
      ON study_sessions (learner_id, logged_at);

    -- One submission per assessed item.
    --
    -- The explanations column is JSON keyed by checkpoint index: an account of
    -- how each checkpoint was satisfied. That is a self-explanation prompt,
    -- which is among the best-evidenced cheap interventions in the literature
    -- (g ~ 0.55 across 64 studies), and the checkpoints already existed as
    -- resume markers doing nothing else.
    CREATE TABLE IF NOT EXISTS submissions (
      learner_id   TEXT NOT NULL,
      item_key     TEXT NOT NULL,
      explanations TEXT NOT NULL DEFAULT '{}',
      artifact_url TEXT,
      submitted_at TEXT,
      updated_at   TEXT NOT NULL,
      PRIMARY KEY (learner_id, item_key)
    );

    -- The learner's own score, recorded BEFORE any judge sees the work.
    --
    -- The ordering is the point, not bookkeeping. Immediate feedback flatters
    -- performance and depresses learning; scoring yourself first is the
    -- desirable difficulty that makes the panel informative rather than merely
    -- pleasant. The gap between this and the panel is calibration, and it is
    -- the one number in this transcript that measures judgement rather than
    -- effort.
    CREATE TABLE IF NOT EXISTS self_assessments (
      learner_id   TEXT    NOT NULL,
      item_key     TEXT    NOT NULL,
      criterion_id TEXT    NOT NULL,
      level        INTEGER NOT NULL,
      recorded_at  TEXT    NOT NULL,
      PRIMARY KEY (learner_id, item_key, criterion_id)
    );

    -- A judge's verbatim response. The raw text is kept forever and scores are
    -- derived from it, so a better parser can re-read an old judgement. A
    -- replaced judgement is superseded, never overwritten: the moment a verdict
    -- can be quietly rewritten after it is seen, the panel stops being evidence.
    CREATE TABLE IF NOT EXISTS judgements (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      learner_id    TEXT NOT NULL,
      item_key      TEXT NOT NULL,
      judge         TEXT NOT NULL,
      body          TEXT NOT NULL,
      pasted_at     TEXT NOT NULL,
      superseded_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_judgements_item
      ON judgements (learner_id, item_key, superseded_at);

    -- Parsed per-criterion levels. NULL means the judge declined the criterion
    -- as not verifiable from the submitted text, which is a legitimate answer
    -- and must not be confused with a zero.
    CREATE TABLE IF NOT EXISTS judgement_scores (
      judgement_id INTEGER NOT NULL REFERENCES judgements(id),
      criterion_id TEXT    NOT NULL,
      level        INTEGER,
      PRIMARY KEY (judgement_id, criterion_id)
    );
  `);

  return db;
}

const COOKIE = "mainquest_uid";

export const LEARNER_COOKIE = COOKIE;
