/** Shapes shared between the server and the client for Indie Degree. */

export type ItemType =
  | "lecture"
  | "reading"
  | "assignment"
  | "project"
  | "retention"
  | "defense";

export type ItemStatus = "not_started" | "in_progress" | "complete";

/** Curriculum shapes — these mirror curriculum/*.json exactly. */

export interface Resource {
  id: string;
  title: string;
  author?: string;
  type: string;
  ref: string;
  url?: string;
  kind: string;
  cost: string;
  est_hours?: number;
  note?: string;
  skills?: string[];
  verification: { method: string; observed_author?: string };
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  brief?: string;
  locator?: string;
  est_minutes: number;
  tier: number;
  resource?: string;
  rubric?: string;
  /** Which skills this item evidences. Every item in the corpus carries these. */
  skills?: string[];
  checkpoints?: string[];
  optional?: boolean;
  optional_reason?: string;
  advanced_standing_exempt?: boolean;
  exempt_rationale?: string;
}

export interface Module {
  id: string;
  title: string;
  est_minutes: number;
  items: Item[];
}

/** One thing a judge scores, 0–3, with what each score actually means. */
export interface RubricCriterion {
  id: string;
  criterion: string;
  weight: number;
  levels: Record<string, string>;
}

/**
 * A condition that must hold before the work is judged.
 *
 * Named `preconditions` rather than `machine_checks`, which is what this was
 * called until the count was done: of 468 across the programme, 458 are prose
 * a human confirms and only 10 carry a number and a comparator a machine could
 * evaluate. The old name promised an automation that does not exist, and a
 * field name that lies is worse than a vague one because nobody re-reads it.
 */
export interface Precondition {
  check: string;
  blocking: boolean;
}

export interface Rubric {
  id: string;
  for: string;
  tier: number;
  criteria: RubricCriterion[];
  preconditions?: Precondition[];
  anti_gaming?: string;
  integrity?: string;
}

export interface Panel {
  models: string[];
  blind: boolean;
  disagreement: string;
}

export interface CourseSpec {
  course: string;
  title: string;
  credits: number;
  est_hours: number;
  optional_hours?: number;
  premise: string;
  laboratory?: string;
  panel?: Panel;
  modules: Module[];
  rubrics: Rubric[];
}

export interface Skill {
  id: string;
  name: string;
  area: string;
  prereqs: string[];
  note?: string;
}

/**
 * What a capability claim costs.
 *
 * `min_items` and `min_tier` are the volume of assessed work. The other two are
 * the parts a diligent afternoon cannot fake: a bar set by the person it
 * certifies is worth nothing unless it imports difficulty from outside.
 * `defence` means answering questions you did not write; `cold_recall` means
 * explaining it again later with no notes.
 */
export interface Bar {
  min_items: number;
  min_tier: number;
  defence: boolean;
  cold_recall: boolean;
}

/**
 * The public thing a claim points at, built for the purpose. The four products
 * are products — a reader who opens one sees a job-matching app, not RAG.
 * `negative_result` records where the technique stopped working, and is
 * mandatory because it is the half nobody fakes.
 */
export interface Artifact {
  name: string;
  url: string | null;
  what: string;
  negative_result: string | null;
}

/** A CV line, and what it would take to earn it honestly. */
export interface Area {
  id: string;
  name: string;
  claimable: boolean;
  cv_line?: string;
  claim?: string;
  supporting_note?: string;
  artifact?: Artifact;
  bar?: Bar;
}

/** One requirement of a bar, and whether the evidence exists yet. */
export interface Requirement {
  label: string;
  met: boolean;
  /** What is still missing, in the reader's terms. Null once met. */
  gap: string | null;
}

export interface CapabilityStatus {
  area: Area;
  skills: Skill[];
  /** Assessed items tagged with this area, across specified courses only. */
  assessed: number;
  completed: number;
  /** Completed at or above the bar's tier. */
  qualifying: number;
  requirements: Requirement[];
  met: boolean;
  /** False when no specified course teaches it yet — unearnable, not unearned. */
  reachable: boolean;
}

export interface Course {
  id: string;
  title: string;
  block: string;
  credits: number;
  est_hours: number;
  optional_hours?: number;
  value_rank: number;
  why: string;
  prereq_courses: string[];
  advanced_standing: string;
  outcomes: string[];
  skills_taught: string[];
  spec?: string;
}

/** Progress shapes — what the client actually renders. */

export interface ItemProgress {
  status: ItemStatus;
  minutes_logged: number;
  checkpoints: number[];
  completed_at: string | null;
}

export interface CourseProgress {
  courseId: string;
  requiredItems: number;
  completeItems: number;
  requiredMinutes: number;
  completeMinutes: number;
  minutesLogged: number;
  /** A course counts as earned only when every required item is complete. */
  earned: boolean;
}

export interface Banked {
  itemsComplete: number;
  hoursLogged: number;
  creditsEarned: number;
  creditsAvailable: number;
  requiredHoursRemaining: number;
  /** Null until there is enough history to say anything honest. */
  weeklyHours: number | null;
  projection: { fastWeeks: number; slowWeeks: number } | null;
  lastActivity: string | null;
}

export interface ProgressPayload {
  banked: Banked;
  courses: Record<string, CourseProgress>;
  items: Record<string, ItemProgress>;
}
