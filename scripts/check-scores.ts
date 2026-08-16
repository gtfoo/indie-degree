/**
 * Assert the judge-reply parser, without a database.
 *
 *   node --experimental-strip-types scripts/check-scores.ts
 *
 * This is the only place in the app where free text from a model becomes a
 * number in a transcript, so it is the piece most worth being paranoid about.
 * The distinction that must never collapse: a declined criterion is null, not
 * zero.
 */
import { parseScores } from "../src/products/parseScores.ts";
import type { Rubric } from "../src/products/types.ts";

const rubric = {
  id: "R", for: "M1", tier: 2,
  criteria: [
    { id: "c1", criterion: "one", weight: 0.5, levels: { "0": "", "1": "", "2": "", "3": "" } },
    { id: "c2", criterion: "two", weight: 0.5, levels: { "0": "", "1": "", "2": "", "3": "" } },
  ],
} as Rubric;

let failed = 0;
function check(name: string, ok: boolean, detail = ""): void {
  if (ok) console.log(`  ok    ${name}`);
  else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const plain = parseScores("SCORES\nc1: 2\nc2: 0", rubric);
check("reads the block", plain.c1 === 2 && plain.c2 === 0, JSON.stringify(plain));

const declined = parseScores('SCORES\nc1: 3\nc2: not verifiable from this text', rubric);
check(
  "a declined criterion is null, never zero",
  declined.c1 === 3 && declined.c2 === null,
  JSON.stringify(declined),
);

// A model that reasons about levels in prose before its block must not have the
// prose scored. The last SCORES header wins.
const chatty = parseScores(
  "c1: level 2 would be wrong here, I think it is a 3.\n\nSCORES\nc1: 3\nc2: 1",
  rubric,
);
check("prose before the block does not win", chatty.c1 === 3, JSON.stringify(chatty));

const bulleted = parseScores("SCORES\n- [c1]: 1\n* c2 = 2", rubric);
check("tolerates bullets, brackets and equals", bulleted.c1 === 1 && bulleted.c2 === 2,
  JSON.stringify(bulleted));

const noBlock = parseScores("c1: 2\nc2: 3", rubric);
check("falls back when the block is missing", noBlock.c1 === 2 && noBlock.c2 === 3,
  JSON.stringify(noBlock));

const junk = parseScores("SCORES\nc1: 12\nc2: banana", rubric);
check("refuses out-of-range and prose values", junk.c1 === null && junk.c2 === null,
  JSON.stringify(junk));

const unknown = parseScores("SCORES\nc1: 2\nc9: 3", rubric);
check("ignores criteria not in the rubric", !("c9" in unknown), JSON.stringify(unknown));

const missing = parseScores("SCORES\nc1: 2", rubric);
check("a criterion the judge skipped is simply absent", !("c2" in missing),
  JSON.stringify(missing));

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall good");
