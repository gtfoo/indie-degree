import { NextResponse } from "next/server";
import { itemKey, itemsOf, getSpec } from "@/server/curriculum";
import { isOwner } from "@/auth";
import {
  addJudgement,
  getAssessment,
  saveSelfAssessment,
  saveSubmission,
  recordColdAttempt,
  OrderError,
} from "@/server/submissions";

export const dynamic = "force-dynamic";

/**
 * A route handler, for the same reason as /api/progress: Server Action ids go
 * stale across a deploy and a POST from a long-lived page then looks like the
 * hostile probe the host's fail2ban jail bans.
 */

/** Which judges may be recorded. Free chat interfaces, three vendors, no keys. */
const JUDGES = new Set(["claude", "chatgpt", "gemini"]);

function resolve(courseId?: string, itemId?: string) {
  if (!courseId || !itemId || !getSpec(courseId)) return null;
  const spec = getSpec(courseId)!;
  const item = itemsOf(courseId).find((i) => i.id === itemId);
  if (!item?.rubric) return null;
  const rubric = spec.rubrics.find((r) => r.id === item.rubric);
  if (!rubric) return null;
  return { item, rubric, key: itemKey(courseId, itemId) };
}

/** Public, like the rest of the transcript. Evidence nobody can read is not evidence. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const found = resolve(
    url.searchParams.get("courseId") ?? undefined,
    url.searchParams.get("itemId") ?? undefined,
  );
  if (!found) return NextResponse.json({ error: "unknown item" }, { status: 400 });
  return NextResponse.json(getAssessment(found.key, found.rubric));
}

export async function POST(request: Request) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "read only" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const {
    courseId, itemId, action, explanations, artifactUrl, submit, scores, judge,
    text, outcome,
  } = (body ?? {}) as {
    courseId?: string;
    itemId?: string;
    action?: string;
    explanations?: Record<string, string>;
    artifactUrl?: string | null;
    submit?: boolean;
    scores?: Record<string, number>;
    judge?: string;
    text?: string;
    outcome?: string;
  };

  const found = resolve(courseId, itemId);
  if (!found) return NextResponse.json({ error: "unknown item" }, { status: 400 });
  const { rubric, key } = found;

  if (action === "submission") {
    saveSubmission(key, explanations ?? {}, artifactUrl?.trim() || null, Boolean(submit));
    return NextResponse.json(getAssessment(key, rubric));
  }

  if (action === "self") {
    const valid = new Set(rubric.criteria.map((c) => c.id));
    const clean: Record<string, number> = {};
    for (const [cid, level] of Object.entries(scores ?? {})) {
      if (!valid.has(cid)) continue;
      if (!Number.isInteger(level) || level < 0 || level > 3) {
        return NextResponse.json({ error: `bad level for ${cid}` }, { status: 400 });
      }
      clean[cid] = level;
    }
    if (Object.keys(clean).length !== rubric.criteria.length) {
      // Partial self-assessment would let the learner score only the criteria
      // they feel good about, and the calibration figure would flatter them.
      return NextResponse.json(
        { error: "score every criterion before recording" },
        { status: 400 },
      );
    }
    saveSelfAssessment(key, clean);
    return NextResponse.json(getAssessment(key, rubric));
  }

  if (action === "cold") {
    // Tier 1 only. Above that the check needs a panel, and convening one before
    // every reading costs more than the reading it was meant to save.
    if (found.item.tier !== 1) {
      return NextResponse.json(
        { error: "attempting cold only applies to tier-1 items" },
        { status: 400 },
      );
    }
    if (outcome !== "passed" && outcome !== "missed") {
      return NextResponse.json({ error: "unknown outcome" }, { status: 400 });
    }
    recordColdAttempt(key, outcome);
    return NextResponse.json(getAssessment(key, rubric));
  }

  if (action === "judgement") {
    if (!judge || !JUDGES.has(judge)) {
      return NextResponse.json({ error: "unknown judge" }, { status: 400 });
    }
    if (!text?.trim()) {
      return NextResponse.json({ error: "empty response" }, { status: 400 });
    }
    try {
      addJudgement(key, judge, text, rubric);
    } catch (err) {
      if (err instanceof OrderError) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      throw err;
    }
    return NextResponse.json(getAssessment(key, rubric));
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
