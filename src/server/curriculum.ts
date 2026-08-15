/**
 * The curriculum, read from the JSON that scripts/corpus/validate.py checks.
 *
 * Deliberately not seeded into SQLite. The JSON is the source of truth because
 * it is reviewable in a diff and validated before it lands; the database holds
 * only what cannot be regenerated, which is the record of work actually done.
 * Imported rather than read from disk so the bundle carries it and nothing
 * depends on the source tree surviving a build.
 */

import programmeJson from "@/products/curriculum/programme.json";
import resourcesJson from "@/products/curriculum/resources.verified.json";
import aie101 from "@/products/curriculum/courses/AIE-101-llm-application-engineering.json";
import aie102 from "@/products/curriculum/courses/AIE-102-evaluation-and-measurement.json";
import aie103 from "@/products/curriculum/courses/AIE-103-retrieval-and-context-systems.json";
import aie104 from "@/products/curriculum/courses/AIE-104-agents-and-tool-use-systems.json";
import aie105 from "@/products/curriculum/courses/AIE-105-inference-cost-and-latency.json";
import aie106 from "@/products/curriculum/courses/AIE-106-speech-and-multimodal-systems.json";
import aie107 from "@/products/curriculum/courses/AIE-107-architecture-and-judgement.json";
import aie201 from "@/products/curriculum/courses/AIE-201-mathematics-for-machine-learning.json";
import aie202 from "@/products/curriculum/courses/AIE-202-machine-learning-foundations.json";
import aie203 from "@/products/curriculum/courses/AIE-203-deep-learning.json";
import aie204 from "@/products/curriculum/courses/AIE-204-transformers-and-llms-from-scratch.json";

import type {
  Area,
  Course,
  CourseSpec,
  Item,
  Resource,
  Skill,
} from "@/products/types";

const SPECS = [
  aie101,
  aie102,
  aie103,
  aie104,
  aie105,
  aie106,
  aie107,
  aie201,
  aie202,
  aie203,
  aie204,
] as unknown as CourseSpec[];

const specByCourse = new Map<string, CourseSpec>(
  SPECS.map((s) => [s.course, s]),
);

export const programme = programmeJson.programme;

export interface Block {
  id: string;
  title: string;
  purpose: string;
  credits: number;
}

export const blocks: Block[] = programmeJson.blocks as Block[];

export const courses: Course[] = (programmeJson.courses as unknown as Course[])
  .slice()
  .sort((a, b) => a.value_rank - b.value_rank);

export const resources = new Map<string, Resource>(
  (resourcesJson.resources as unknown as Resource[]).map((r) => [r.id, r]),
);

/**
 * Areas are the capability claims — the lines that go in a CV's skills section.
 * Ordered claimable-first, since the supporting areas exist to make the others
 * defensible rather than to be shown off.
 */
export const areas: Area[] = (programmeJson.areas as unknown as Area[])
  .slice()
  .sort((a, b) => Number(b.claimable) - Number(a.claimable));

export const skills: Skill[] = programmeJson.skills as unknown as Skill[];

const skillsByArea = new Map<string, Skill[]>();
for (const s of skills) {
  const list = skillsByArea.get(s.area) ?? [];
  list.push(s);
  skillsByArea.set(s.area, list);
}

export function getArea(id: string): Area | undefined {
  return areas.find((a) => a.id === id);
}

export function skillsOf(areaId: string): Skill[] {
  return skillsByArea.get(areaId) ?? [];
}

export function getSkill(id: string): Skill | undefined {
  return skills.find((s) => s.id === id);
}

export function getCourse(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}

export function getSpec(id: string): CourseSpec | undefined {
  return specByCourse.get(id);
}

/** Courses that have a full specification, in study order. */
export function specifiedCourses(): Course[] {
  return courses.filter((c) => specByCourse.has(c.id));
}

export function itemsOf(courseId: string): Item[] {
  const spec = specByCourse.get(courseId);
  if (!spec) return [];
  return spec.modules.flatMap((m) => m.items);
}

/** Globally unique key for an item, since ids repeat across courses. */
export function itemKey(courseId: string, itemId: string): string {
  return `${courseId}/${itemId}`;
}

export function requiredItems(courseId: string): Item[] {
  return itemsOf(courseId).filter((i) => !i.optional);
}

/**
 * The resource link for an item, derived the same way render.py does it so the
 * page and the Markdown never disagree about where something lives.
 */
export function resourceUrl(r: Resource): string | null {
  if (r.url) return r.url;
  switch (r.type) {
    case "youtube":
      return `https://www.youtube.com/watch?v=${r.ref}`;
    case "youtube_playlist":
      return `https://www.youtube.com/playlist?list=${r.ref}`;
    case "arxiv":
      return `https://arxiv.org/abs/${r.ref}`;
    case "github":
      return `https://github.com/${r.ref}`;
    case "book":
      return `https://openlibrary.org/isbn/${r.ref}`;
    case "web":
    case "pdf":
      return r.ref;
    default:
      return null;
  }
}

/** Total required minutes across every specified course. */
export function totalRequiredMinutes(): number {
  return specifiedCourses().reduce(
    (sum, c) =>
      sum + requiredItems(c.id).reduce((s, i) => s + i.est_minutes, 0),
    0,
  );
}
