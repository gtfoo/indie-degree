-- Indie Degree — SQLite schema (Phase 0 draft)
--
-- Two kinds of table live here and they have different lifecycles:
--
--   Curriculum tables are DERIVED. They are seeded from the JSON in
--   curriculum/ and can be dropped and rebuilt at any time. The JSON is the
--   source of truth, because it is reviewable in a diff and validated by
--   scripts/corpus/validate.py before it ever reaches the database.
--
--   Learner tables are DURABLE. They are the only thing that cannot be
--   regenerated, and no reseed may touch them.
--
-- Everything a reseed is allowed to delete is marked `-- derived`. Everything
-- else is the record of work actually done.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;


-- ---------------------------------------------------------------- curriculum

CREATE TABLE IF NOT EXISTS programmes (        -- derived
  id            TEXT PRIMARY KEY,
  title         TEXT    NOT NULL,
  subtitle      TEXT,
  framing       TEXT    NOT NULL,              -- 'transcript' | 'diploma'
  credit_unit   TEXT    NOT NULL,
  total_credits INTEGER NOT NULL,
  total_hours   INTEGER NOT NULL,
  opened        TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS blocks (            -- derived
  id           TEXT PRIMARY KEY,
  programme_id TEXT    NOT NULL REFERENCES programmes(id),
  title        TEXT    NOT NULL,
  purpose      TEXT    NOT NULL,
  position     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (           -- derived
  id           TEXT PRIMARY KEY,
  block_id     TEXT    NOT NULL REFERENCES blocks(id),
  title        TEXT    NOT NULL,
  credits      INTEGER NOT NULL,
  est_hours    INTEGER NOT NULL,
  -- Study order. Value-weighted within prerequisite constraints, so that
  -- stopping at any point leaves the best of the programme already banked.
  value_rank   INTEGER NOT NULL UNIQUE,
  why          TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS course_prereqs (    -- derived
  course_id TEXT NOT NULL REFERENCES courses(id),
  prereq_id TEXT NOT NULL REFERENCES courses(id),
  PRIMARY KEY (course_id, prereq_id)
);

CREATE TABLE IF NOT EXISTS course_outcomes (   -- derived
  course_id TEXT    NOT NULL REFERENCES courses(id),
  position  INTEGER NOT NULL,
  outcome   TEXT    NOT NULL,
  PRIMARY KEY (course_id, position)
);

CREATE TABLE IF NOT EXISTS modules (           -- derived
  id          TEXT PRIMARY KEY,
  course_id   TEXT    NOT NULL REFERENCES courses(id),
  title       TEXT    NOT NULL,
  position    INTEGER NOT NULL,
  est_minutes INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS items (             -- derived
  id          TEXT PRIMARY KEY,
  module_id   TEXT    NOT NULL REFERENCES modules(id),
  position    INTEGER NOT NULL,
  type        TEXT    NOT NULL,   -- lecture|reading|assignment|project|retention|defense
  title       TEXT    NOT NULL,
  brief       TEXT,
  -- One sitting, always. Irregular pacing means an item must never depend on
  -- yesterday's working memory to resume.
  est_minutes INTEGER NOT NULL CHECK (est_minutes <= 180),
  tier        INTEGER NOT NULL CHECK (tier BETWEEN 0 AND 4),
  resource_id TEXT REFERENCES resources(id),
  rubric_id   TEXT REFERENCES rubrics(id),
  fsrs        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS item_checkpoints (  -- derived
  item_id  TEXT    NOT NULL REFERENCES items(id),
  position INTEGER NOT NULL,
  label    TEXT    NOT NULL,
  PRIMARY KEY (item_id, position)
);

CREATE TABLE IF NOT EXISTS resources (         -- derived
  id             TEXT PRIMARY KEY,
  title          TEXT    NOT NULL,
  author         TEXT,
  kind           TEXT    NOT NULL,
  url            TEXT,
  cost           TEXT    NOT NULL,
  est_hours      REAL,
  -- Provenance of the identity check, carried through from verify.py so the
  -- UI can show which guarantee a row actually has. 'pdf-contenttype' is
  -- weaker than 'youtube-oembed' and should not be displayed as if equal.
  verify_method  TEXT    NOT NULL,
  verify_status  TEXT    NOT NULL,
  observed_title TEXT,
  verified_at    TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (            -- derived
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS skill_prereqs (     -- derived
  skill_id  TEXT NOT NULL REFERENCES skills(id),
  prereq_id TEXT NOT NULL REFERENCES skills(id),
  PRIMARY KEY (skill_id, prereq_id)
);

-- Skills map many-to-many onto courses, items and artifacts. This is what
-- makes the tree structural rather than decorative, and what makes a
-- curriculum forkable to another domain later.
CREATE TABLE IF NOT EXISTS course_skills (     -- derived
  course_id TEXT NOT NULL REFERENCES courses(id),
  skill_id  TEXT NOT NULL REFERENCES skills(id),
  PRIMARY KEY (course_id, skill_id)
);

CREATE TABLE IF NOT EXISTS item_skills (       -- derived
  item_id  TEXT NOT NULL REFERENCES items(id),
  skill_id TEXT NOT NULL REFERENCES skills(id),
  PRIMARY KEY (item_id, skill_id)
);

CREATE TABLE IF NOT EXISTS resource_skills (   -- derived
  resource_id TEXT NOT NULL REFERENCES resources(id),
  skill_id    TEXT NOT NULL REFERENCES skills(id),
  PRIMARY KEY (resource_id, skill_id)
);

CREATE TABLE IF NOT EXISTS rubrics (           -- derived
  id           TEXT PRIMARY KEY,
  item_id      TEXT    NOT NULL,
  tier         INTEGER NOT NULL CHECK (tier BETWEEN 0 AND 4),
  anti_gaming  TEXT,
  integrity    TEXT,
  registered   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS rubric_criteria (   -- derived
  rubric_id  TEXT NOT NULL REFERENCES rubrics(id),
  criterion_id TEXT NOT NULL,
  criterion  TEXT NOT NULL,
  weight     REAL NOT NULL,
  level_0    TEXT NOT NULL,
  level_1    TEXT NOT NULL,
  level_2    TEXT NOT NULL,
  level_3    TEXT NOT NULL,
  PRIMARY KEY (rubric_id, criterion_id)
);

CREATE TABLE IF NOT EXISTS rubric_preconditions (  -- derived
  rubric_id TEXT    NOT NULL REFERENCES rubrics(id),
  position  INTEGER NOT NULL,
  check_desc TEXT   NOT NULL,
  blocking  INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (rubric_id, position)
);


-- ---------------------------------------------------------------- learner

CREATE TABLE IF NOT EXISTS learners (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS enrolments (
  learner_id   TEXT NOT NULL REFERENCES learners(id),
  programme_id TEXT NOT NULL REFERENCES programmes(id),
  started_at   TEXT NOT NULL,
  PRIMARY KEY (learner_id, programme_id)
);

-- Progress is banked and monotonic. There is deliberately no streak table and
-- no "current streak" column anywhere: on an irregular schedule a broken
-- streak reads as failure and stops the learner opening the app at all.
-- Everything recorded here only ever goes up.
CREATE TABLE IF NOT EXISTS item_progress (
  learner_id     TEXT    NOT NULL REFERENCES learners(id),
  item_id        TEXT    NOT NULL REFERENCES items(id),
  status         TEXT    NOT NULL DEFAULT 'not_started',
                 -- not_started | in_progress | submitted | assessed | complete
  minutes_logged INTEGER NOT NULL DEFAULT 0,
  started_at     TEXT,
  completed_at   TEXT,
  updated_at     TEXT    NOT NULL,
  PRIMARY KEY (learner_id, item_id)
);

CREATE TABLE IF NOT EXISTS checkpoint_progress (
  learner_id  TEXT    NOT NULL REFERENCES learners(id),
  item_id     TEXT    NOT NULL REFERENCES items(id),
  position    INTEGER NOT NULL,
  reached_at  TEXT    NOT NULL,
  PRIMARY KEY (learner_id, item_id, position)
);

-- The only honest source for a completion estimate. Projected dates come from
-- logged minutes, never from intended hours per week.
CREATE TABLE IF NOT EXISTS study_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id  TEXT    NOT NULL REFERENCES learners(id),
  item_id     TEXT REFERENCES items(id),
  started_at  TEXT    NOT NULL,
  ended_at    TEXT    NOT NULL,
  minutes     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_learner_time
  ON study_sessions (learner_id, started_at);


-- ---------------------------------------------------------------- assessment

CREATE TABLE IF NOT EXISTS submissions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id   TEXT    NOT NULL REFERENCES learners(id),
  item_id      TEXT    NOT NULL REFERENCES items(id),
  attempt      INTEGER NOT NULL DEFAULT 1,
  body         TEXT,                 -- in-app markdown, for written work
  repo_url     TEXT,                 -- code work lives in a repo, not here
  artifact_url TEXT,
  audio_path   TEXT,                 -- tier 4 defenses
  transcript   TEXT,
  -- The rubric as it stood when this was submitted. Pre-registration is
  -- meaningless if a later edit can retroactively change a grade, so the
  -- rubric is frozen into the submission rather than referenced by id.
  rubric_json  TEXT    NOT NULL,
  submitted_at TEXT    NOT NULL,
  UNIQUE (learner_id, item_id, attempt)
);

CREATE TABLE IF NOT EXISTS machine_check_results (
  submission_id INTEGER NOT NULL REFERENCES submissions(id),
  position      INTEGER NOT NULL,
  passed        INTEGER NOT NULL,
  detail        TEXT,
  checked_at    TEXT    NOT NULL,
  PRIMARY KEY (submission_id, position)
);

-- One row per judge per criterion. Never pre-aggregated: the spread between
-- judges is information about the assessment's confidence, and averaging it
-- away is exactly the failure AIE-102 teaches the learner to detect.
CREATE TABLE IF NOT EXISTS assessments (
  submission_id INTEGER NOT NULL REFERENCES submissions(id),
  judge         TEXT    NOT NULL,   -- model id
  criterion_id  TEXT    NOT NULL,
  score         INTEGER NOT NULL CHECK (score BETWEEN 0 AND 3),
  reasoning     TEXT    NOT NULL,
  quote         TEXT,               -- span from the submission supporting the score
  assessed_at   TEXT    NOT NULL,
  PRIMARY KEY (submission_id, judge, criterion_id)
);

CREATE TABLE IF NOT EXISTS assessment_runs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id  INTEGER NOT NULL REFERENCES submissions(id),
  judge          TEXT    NOT NULL,
  input_tokens   INTEGER NOT NULL,
  output_tokens  INTEGER NOT NULL,
  cost_usd       REAL,
  ran_at         TEXT    NOT NULL
);

-- Computed in TypeScript from tiered evidence. No model ever writes here.
CREATE TABLE IF NOT EXISTS grades (
  submission_id  INTEGER PRIMARY KEY REFERENCES submissions(id),
  score          REAL    NOT NULL,
  tier           INTEGER NOT NULL CHECK (tier BETWEEN 0 AND 4),
  max_spread     INTEGER NOT NULL,  -- widest judge disagreement on any criterion
  contested      INTEGER NOT NULL DEFAULT 0,  -- 1 when max_spread >= 2
  blocked        INTEGER NOT NULL DEFAULT 0,  -- a blocking machine check failed
  computed_at    TEXT    NOT NULL
);


-- ---------------------------------------------------------------- mastery

-- Mastery decays. A transcript that says "completed, March 2026" is a claim
-- about the past; this makes it a claim about the present. Fields mirror
-- ts-fsrs, which the repository already uses for LearnIndo.
CREATE TABLE IF NOT EXISTS skill_reviews (
  learner_id     TEXT    NOT NULL REFERENCES learners(id),
  skill_id       TEXT    NOT NULL REFERENCES skills(id),
  due            TEXT    NOT NULL,
  stability      REAL    NOT NULL,
  difficulty     REAL    NOT NULL,
  elapsed_days   REAL    NOT NULL,
  scheduled_days REAL    NOT NULL,
  learning_steps INTEGER NOT NULL DEFAULT 0,
  reps           INTEGER NOT NULL,
  lapses         INTEGER NOT NULL,
  state          INTEGER NOT NULL,
  last_review    TEXT,
  updated_at     TEXT    NOT NULL,
  PRIMARY KEY (learner_id, skill_id)
);


-- ---------------------------------------------------------------- prior work

CREATE TABLE IF NOT EXISTS artifacts (
  id         TEXT PRIMARY KEY,
  learner_id TEXT    NOT NULL REFERENCES learners(id),
  name       TEXT    NOT NULL,
  url        TEXT,
  summary    TEXT    NOT NULL,
  tier       INTEGER NOT NULL CHECK (tier BETWEEN 0 AND 4),
  created_at TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS advanced_standing (
  learner_id      TEXT    NOT NULL REFERENCES learners(id),
  skill_id        TEXT    NOT NULL REFERENCES skills(id),
  level           INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  rationale       TEXT    NOT NULL,
  -- Every award states what cuts against it. Same discipline as Career Side
  -- Quests: an assessment that only argues one direction is advocacy.
  counter_evidence TEXT   NOT NULL,
  assessed_at     TEXT    NOT NULL,
  PRIMARY KEY (learner_id, skill_id)
);

CREATE TABLE IF NOT EXISTS advanced_standing_artifacts (
  learner_id  TEXT NOT NULL REFERENCES learners(id),
  skill_id    TEXT NOT NULL REFERENCES skills(id),
  artifact_id TEXT NOT NULL REFERENCES artifacts(id),
  PRIMARY KEY (learner_id, skill_id, artifact_id)
);

CREATE TABLE IF NOT EXISTS advanced_standing_credit (
  learner_id TEXT    NOT NULL REFERENCES learners(id),
  course_id  TEXT    NOT NULL REFERENCES courses(id),
  awarded    INTEGER NOT NULL,
  rationale  TEXT    NOT NULL,
  remaining  TEXT    NOT NULL,
  PRIMARY KEY (learner_id, course_id)
);


-- ---------------------------------------------------------------- transcript

-- The public artifact. Materialised rather than computed at request time so a
-- published transcript URL keeps showing what it showed when it was shared.
CREATE TABLE IF NOT EXISTS transcript_snapshots (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id   TEXT    NOT NULL REFERENCES learners(id),
  slug         TEXT    NOT NULL UNIQUE,
  body_json    TEXT    NOT NULL,
  published_at TEXT    NOT NULL
);
