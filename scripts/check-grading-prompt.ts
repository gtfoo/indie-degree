/**
 * Print and sanity-check the grading prompt for one item, without a browser.
 *
 *   node --experimental-strip-types scripts/check-grading-prompt.ts AIE-102 M2.5
 *
 * The prompt is the whole interface to a hand-run judging panel, so it is worth
 * being able to read exactly what a judge will receive.
 */
import { gradingPrompt } from "../src/products/gradingPrompt.ts";
import type { CourseSpec } from "../src/products/types.ts";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const [courseId = "AIE-102", itemId = "M2.5"] = process.argv.slice(2);
const dir = "src/products/curriculum/courses";
const file = readdirSync(dir).find((f) => f.startsWith(courseId));
if (!file) throw new Error(`no spec for ${courseId}`);

const spec = JSON.parse(readFileSync(join(dir, file), "utf-8")) as CourseSpec;
const item = spec.modules.flatMap((m) => m.items).find((i) => i.id === itemId);
if (!item) throw new Error(`no item ${itemId} in ${courseId}`);
const rubric = spec.rubrics.find((r) => r.id === item.rubric);
if (!rubric) throw new Error(`item ${itemId} has no rubric`);

const prompt = gradingPrompt(item, rubric);
console.log(prompt);
console.log("\n" + "-".repeat(60));

const checks: [string, boolean][] = [
  ["names every criterion", rubric.criteria.every((c) => prompt.includes(c.criterion))],
  [
    "includes all four levels for every criterion",
    rubric.criteria.every((c) =>
      ["0", "1", "2", "3"].every((l) => prompt.includes(c.levels[l])),
    ),
  ],
  ["leaks no weights", !/\d+\s*%/.test(prompt)],
  ["forbids totalling", /Do not compute a total/.test(prompt)],
  ["asks for a parseable SCORES block", /^SCORES$/m.test(prompt)],
  [
    "names every criterion id in that block",
    rubric.criteria.every((c) => new RegExp(`^${c.id}: `, "m").test(prompt)),
  ],
  ["allows declining unverifiable criteria", /not verifiable from this text/.test(prompt)],
  ["demands a quote before a score", /Quote the exact span/.test(prompt)],
  ["asks for the counter-argument", /too generous/.test(prompt)],
  [
    "carries the anti-gaming rule when there is one",
    !rubric.anti_gaming || prompt.includes(rubric.anti_gaming),
  ],
];

let bad = 0;
for (const [name, ok] of checks) {
  if (!ok) bad += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${name}`);
}
console.log(`\n${prompt.length} characters`);
if (bad) process.exit(1);
