import type { Item, Rubric } from "./types";

/**
 * The prompt you paste into a chat window to have one model judge one
 * submission.
 *
 * Grading happens by hand for now — three chat windows, three independent
 * judgements — so this exists to stop the chat UI quietly destroying the
 * properties that make a panel worth anything. Each instruction below is
 * load-bearing:
 *
 * - **Quote before scoring.** A justification that cannot point at a span is a
 *   justification the model invented. Same move as the verbatim-evidence check
 *   in Career Side Quests: it turns "do I believe this grade" into a string
 *   search.
 * - **"Why not the level above."** Without it judges park on 2 for everything.
 * - **"Argue your score is too generous."** You are the author asking, and a
 *   chat model flatters the person in front of it.
 * - **No weights, no total.** A judge that knows a criterion is worth 40%
 *   optimises the aggregate instead of judging the criterion — and the
 *   arithmetic is supposed to be yours, not a model's.
 * - **An explicit "not verifiable" option.** 45 of 251 criteria in this
 *   programme depend on evidence outside the prose — a timestamp, a commit
 *   history, a harness rerun. Without permission to decline, a judge invents a
 *   verdict on evidence it cannot see.
 */
export function gradingPrompt(item: Item, rubric: Rubric): string {
  const criteria = rubric.criteria
    .map((c, n) => {
      const levels = ["0", "1", "2", "3"]
        .map((l) => `     ${l} — ${c.levels[l]}`)
        .join("\n");
      return `${n + 1}. ${c.criterion}\n${levels}`;
    })
    .join("\n\n");

  const gates = rubric.machine_checks?.length
    ? `\nPRECONDITIONS (the author asserts these are met; flag any the text contradicts)\n` +
      rubric.machine_checks
        .map((c) => `- ${c.check}${c.blocking ? "" : "  [not blocking]"}`)
        .join("\n") +
      "\n"
    : "";

  const notes = [
    rubric.anti_gaming ? `\nANTI-GAMING RULE (apply it)\n${rubric.anti_gaming}\n` : "",
    rubric.integrity ? `\nINTEGRITY RULE (apply it)\n${rubric.integrity}\n` : "",
  ].join("");

  return `You are grading one submission against a rubric written before the
submission existed. The rubric is authoritative. Do not rewrite or improve the
work, and do not comment on anything the rubric does not ask about.

For each criterion, in order:
1. Quote the exact span of the submission that determines the score. If nothing
   in it addresses the criterion, say so explicitly.
2. State which level (0, 1, 2 or 3) that quoted evidence matches, and say why it
   is not the level above.
3. Give the strongest argument that your own score is too generous.

If a criterion depends on evidence that is not in the text below — a timestamp,
a commit history, a rerun of a harness, a page at a URL — answer
"not verifiable from this text" instead of assigning a level. Do not assume such
evidence exists.

Then stop. Do not compute a total, a percentage, an average or an overall grade.

TASK
${item.brief ?? item.title}
${gates}${notes}
RUBRIC
${criteria}

SUBMISSION
<paste your work here, then send>`;
}
