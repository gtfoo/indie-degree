import { NextResponse } from "next/server";
import {
  getProgress,
  setItemStatus,
  toggleCheckpoint,
} from "@/server/progress";
import { itemKey, itemsOf, getSpec } from "@/server/curriculum";
import type { ItemStatus } from "@/products/types";

export const dynamic = "force-dynamic";

/**
 * A route handler rather than a Server Action, deliberately.
 *
 * gtfoo currently ships zero Server Actions, and the droplet's fail2ban jail
 * treats a POST carrying a Next-Action header that 404s on this host as
 * conclusively hostile. Introducing Server Actions here would make a stale tab
 * after a deploy look like an attack and ban the operator's own address. This
 * also matches how LearnIndo already talks to the server.
 */

const STATUSES = new Set<ItemStatus>(["not_started", "in_progress", "complete"]);

export async function GET() {
  return NextResponse.json(getProgress());
}

export async function POST(request: Request) {
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
