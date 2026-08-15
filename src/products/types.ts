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

/** A pass/fail gate. Blocking checks run before any judge is convened. */
export interface MachineCheck {
  check: string;
  blocking: boolean;
}

export interface Rubric {
  id: string;
  for: string;
  tier: number;
  criteria: RubricCriterion[];
  machine_checks?: MachineCheck[];
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
