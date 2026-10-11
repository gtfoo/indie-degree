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
  /**
   * What this item establishes, for bars that require coverage rather than
   * only a count. Only meaningful on assessed items: a reading demonstrates
   * nothing, so tier 0 may not carry one.
   */
  dimension?: Dimension;
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
  /**
   * Which definition of mastery a score was produced under. Absent means 1.
   *
   * Without it, editing a criterion silently reinterprets every score already
   * recorded against it: a 2 awarded under the old wording is filed as a 2
   * under the new one, and the transcript claims evidence it does not have.
   * Evidence rows stamp the version in force when they were written, so an old
   * score stays readable against the rubric that produced it.
   *
   * Bumping is not left to memory. `rubrics.lock.json` holds a hash of every
   * rubric's judged content and `validate.py` refuses a changed rubric whose
   * version did not move — the same reason a lockfile exists at all.
   */
  version?: number;
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
  /**
   * Hard prerequisites: this skill cannot be attempted honestly without them.
   * These are the edges that order the programme.
   */
  prereqs: string[];
  /**
   * Recommended foundations — they help substantially and are not required.
   *
   * Kept separate from `prereqs` because the two were conflated for the first
   * 93 edges of this graph, and in a one-learner programme the expensive
   * mistake is over-constraining the order, not under-constraining it: a hard
   * edge you did not actually need is paid for in hours. Both kinds order the
   * layout, so the suggested path still reads left to right; only `prereqs`
   * states a requirement.
   */
  recommends?: string[];
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
/**
 * What kind of thing an assessed item actually establishes.
 *
 * `min_items` counts evidence and `min_tier` grades it, but neither says
 * anything about coverage: five tier-2 assignments can all be implementation,
 * and a claim backed only by "I built it" is weaker than its count suggests.
 * These four are the dimensions a capability is tested on, so a bar can ask
 * for one of each rather than five of anything.
 */
export type Dimension =
  /** Can the learner build the thing. */
  | "implementation"
  /** Can they find and fix a failure they did not create. */
  | "diagnosis"
  /** Can they defend a trade-off and say what they would do instead. */
  | "judgment"
  /** Can they apply it to something unfamiliar, or after a delay. */
  | "transfer";

export const DIMENSIONS: Dimension[] = [
  "implementation",
  "diagnosis",
  "judgment",
  "transfer",
];

export interface Bar {
  min_items: number;
  min_tier: number;
  defence: boolean;
  cold_recall: boolean;
  /**
   * Dimensions this claim must show evidence in, one qualifying item each.
   * Absent means the claim is counted but not covered — which is the weaker
   * bar every area starts on.
   */
  dimensions?: Dimension[];
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
  /**
   * What this artifact must contain to count. Restated from the assignments in
   * the course that teaches the area, so it adds no new requirement — it just
   * means "not built yet" comes with a specification instead of leaving the
   * builder to reconstruct one from four courses of rubrics.
   */
  requires?: string[];
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

/**
 * Two counts, never one.
 *
 * 42% of the required items in this programme are tier 0 — reading and
 * watching. A single completion bar lets someone who has done every reading and
 * no assignment show the same number as someone who did the reverse, which is
 * exactly the conflation the evidence tiers exist to refuse. Exposure is worth
 * having and worth tracking; it is not evidence, and the UI should make that
 * impossible to miss.
 */
export interface CourseProgress {
  courseId: string;
  requiredItems: number;
  completeItems: number;
  /** Tier 0: read, watched, attended. Counts toward nothing. */
  exposureItems: number;
  exposureComplete: number;
  /** Tier 1 and above: the work that can actually be assessed. */
  evidenceItems: number;
  evidenceComplete: number;
  requiredMinutes: number;
  completeMinutes: number;
  minutesLogged: number;
  /** A course counts as earned only when every required item is complete. */
  earned: boolean;
}

export interface Banked {
  itemsComplete: number;
  /** Assessed items done — the headline, because it is the one that means something. */
  evidenceComplete: number;
  evidenceAvailable: number;
  /** Tier 3: a public artifact exists. */
  artifactsShipped: number;
  /** Tier 4: defended aloud against questions the learner did not write. */
  defended: number;
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
