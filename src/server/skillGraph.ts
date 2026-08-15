/**
 * Layout for the skill prerequisite graph.
 *
 * The graph has been enforced in Python since the corpus was built —
 * validate.py refuses a prerequisite cycle — but no reader has ever been able
 * to see it. It carries facts the course list cannot state: that eval design is
 * the most depended-on skill in the programme, and that the deepest chain is
 * eight levels and runs through evaluation on its way to RLHF.
 *
 * Laid out left to right, because a prerequisite chain is read the way a
 * sentence is. Positions are computed here rather than by a layout library:
 * 75 nodes over 8 layers does not justify adding a dependency to an app that
 * runs on next, react, better-sqlite3 and next-auth.
 */

import { skills } from "./curriculum";
import type { Skill } from "@/products/types";

export const NODE_W = 196;
export const NODE_H = 40;
const COL = 250;
const ROW = 50;
const PAD = 16;

export interface LaidOutNode {
  skill: Skill;
  x: number;
  y: number;
  depth: number;
  /** Name split into lines that fit the box. */
  lines: string[];
  dependents: number;
}

export interface LaidOutEdge {
  from: string;
  to: string;
  path: string;
}

export interface GraphLayout {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  width: number;
  height: number;
  depths: number;
}

const byId = new Map(skills.map((s) => [s.id, s]));

/** Longest path from a root. A skill sits one level below its deepest prereq. */
function depths(): Map<string, number> {
  const memo = new Map<string, number>();
  const visit = (id: string): number => {
    const seen = memo.get(id);
    if (seen !== undefined) return seen;
    // Written before the recursion so a cycle cannot hang the render. The
    // validator already rejects cycles; this is belt and braces on a page.
    memo.set(id, 0);
    const prereqs = byId.get(id)?.prereqs ?? [];
    const d = prereqs.length
      ? 1 + Math.max(...prereqs.map((p) => (byId.has(p) ? visit(p) : -1)))
      : 0;
    memo.set(id, d);
    return d;
  };
  for (const s of skills) visit(s.id);
  return memo;
}

/** Two lines at most; the third would not fit the box. */
function wrap(name: string, max = 24): string[] {
  const words = name.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line && (line + " " + w).length > max) {
      lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= 2) return lines;
  return [lines[0], lines.slice(1).join(" ").slice(0, max - 1) + "…"];
}

export function skillGraph(): GraphLayout {
  const depth = depths();
  const maxDepth = Math.max(...depth.values());

  const layers: string[][] = Array.from({ length: maxDepth + 1 }, () => []);
  for (const s of skills) layers[depth.get(s.id)!].push(s.id);

  // Area first, so related skills start adjacent; then one barycentre pass,
  // which pulls each node towards the average position of its prerequisites
  // and takes most of the crossings out without a real layout engine.
  const index = new Map<string, number>();
  layers.forEach((layer, d) => {
    layer.sort((a, b) => {
      const sa = byId.get(a)!;
      const sb = byId.get(b)!;
      return sa.area.localeCompare(sb.area) || sa.name.localeCompare(sb.name);
    });
    if (d > 0) {
      layer.sort((a, b) => bary(a) - bary(b));
    }
    layer.forEach((id, i) => index.set(id, i));
  });

  function bary(id: string): number {
    const ps = (byId.get(id)?.prereqs ?? []).filter((p) => index.has(p));
    if (!ps.length) return Number.MAX_SAFE_INTEGER;
    return ps.reduce((sum, p) => sum + index.get(p)!, 0) / ps.length;
  }

  const dependents = new Map<string, number>();
  for (const s of skills) {
    for (const p of s.prereqs) {
      dependents.set(p, (dependents.get(p) ?? 0) + 1);
    }
  }

  const pos = new Map<string, { x: number; y: number }>();
  const nodes: LaidOutNode[] = [];
  layers.forEach((layer, d) => {
    layer.forEach((id, i) => {
      const x = PAD + d * COL;
      const y = PAD + i * ROW;
      pos.set(id, { x, y });
      nodes.push({
        skill: byId.get(id)!,
        x,
        y,
        depth: d,
        lines: wrap(byId.get(id)!.name),
        dependents: dependents.get(id) ?? 0,
      });
    });
  });

  const edges: LaidOutEdge[] = [];
  for (const s of skills) {
    const to = pos.get(s.id)!;
    for (const p of s.prereqs) {
      const from = pos.get(p);
      if (!from) continue;
      const x1 = from.x + NODE_W;
      const y1 = from.y + NODE_H / 2;
      const x2 = to.x;
      const y2 = to.y + NODE_H / 2;
      const mid = (x1 + x2) / 2;
      edges.push({
        from: p,
        to: s.id,
        path: `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`,
      });
    }
  }

  const height =
    PAD * 2 + Math.max(...layers.map((l) => l.length)) * ROW - (ROW - NODE_H);
  return {
    nodes,
    edges,
    width: PAD * 2 + maxDepth * COL + NODE_W,
    height,
    depths: maxDepth + 1,
  };
}

/** What sits directly on top of a skill — the inverse of prereqs. */
export function dependentsOf(id: string): Skill[] {
  return skills.filter((s) => s.prereqs.includes(id));
}
