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

  const dir = join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });

  db = new Database(join(dir, "indie-degree.sqlite"));
  db.pragma("journal_mode = WAL");

  db.exec(`
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
  `);

  return db;
}

const COOKIE = "mainquest_uid";

export const LEARNER_COOKIE = COOKIE;
