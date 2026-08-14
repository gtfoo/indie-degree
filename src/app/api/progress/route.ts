import { NextResponse } from "next/server";
import {
  getProgress,
  setItemStatus,
  toggleCheckpoint,
} from "@/server/progress";
import { itemKey, itemsOf, getSpec } from "@/server/curriculum";
import { isOwner } from "@/auth";
import type { ItemStatus } from "@/products/types";

export const dynamic = "force-dynamic";

/**
 * A route handler rather than a Server Action.
 *
 * Server Action ids are regenerated on every build, so a tab left open across a
 * deploy POSTs a stale id and gets a 404. That is merely annoying here, but on
 * the host this is deployed alongside it also looks exactly like a hostile
 * probe: the fail2ban jail there bans an address that POSTs a Next-Action
 * header and 404s. Progress updates fire from a long-lived page, which is
 * precisely the traffic that would trip it.
 *
 * Sign-in is the exception and uses Server Actions, because Auth.js is built
 * that way — but those fire once, from a page nobody leaves open.
 */

const STATUSES = new Set<ItemStatus>(["not_started", "in_progress", "complete"]);

/** Public, permanently. A transcript nobody can inspect is not a transcript. */
export async function GET() {
  return NextResponse.json(getProgress());
}

export async function POST(request: Request) {
  // The actual boundary. Hiding the controls from a signed-out reader is a
  // courtesy; this is what stops them writing, and it is checked before the
  // body is even parsed.
  if (!(await isOwner())) {
    return NextResponse.json({ error: "read only" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { courseId, itemId, status, checkpoint } = (body ?? {}) as {
    courseId?: string;
    itemId?: string;
    status?: string;
    checkpoint?: number;
  };

  if (!courseId || !itemId || !getSpec(courseId)) {
    return NextResponse.json({ error: "unknown course" }, { status: 400 });
  }

  const item = itemsOf(courseId).find((i) => i.id === itemId);
  if (!item) {
    return NextResponse.json({ error: "unknown item" }, { status: 400 });
  }

  const key = itemKey(courseId, itemId);

  if (typeof checkpoint === "number") {
    const count = item.checkpoints?.length ?? 0;
    if (checkpoint < 0 || checkpoint >= count) {
      return NextResponse.json({ error: "unknown checkpoint" }, { status: 400 });
    }
    toggleCheckpoint(key, checkpoint);
    return NextResponse.json(getProgress());
  }

  if (!status || !STATUSES.has(status as ItemStatus)) {
    return NextResponse.json({ error: "unknown status" }, { status: 400 });
  }

  setItemStatus(key, status as ItemStatus, item.est_minutes);
  return NextResponse.json(getProgress());
}
