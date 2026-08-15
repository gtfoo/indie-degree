import type { Metadata } from "next";
import Link from "next/link";
import { skillGraph, NODE_W, NODE_H } from "@/server/skillGraph";
import { skillEvidence } from "@/server/capabilities";
import { getProgress } from "@/server/progress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skill graph",
  description:
    "Every skill in the programme and what has to come before it — 75 skills, 93 prerequisites, eight levels deep.",
};

export default async function SkillsPage() {
  const graph = skillGraph();
  const evidence = skillEvidence(getProgress());

  const mostDependedOn = [...graph.nodes]
    .sort((a, b) => b.dependents - a.dependents)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Link
        href="/"
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Programme
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Skill graph</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {graph.nodes.length} skills and {graph.edges.length} prerequisites,{" "}
        {graph.depths} levels deep. Arrows run left to right: everything to the
        left of a skill has to come first. The programme&apos;s study order is
        value-weighted <em>within</em> these constraints, so this graph is what
        the ordering is weighed against.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        The most depended-on skill is{" "}
        <strong className="text-foreground">
          {mostDependedOn[0]?.skill.name}
        </strong>{" "}
        — {mostDependedOn[0]?.dependents} skills sit on top of it, more than
        linear algebra. That is an argument for studying evaluation early that
        comes from the structure rather than from taste.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm border border-accent bg-card" />
          has completed evidence
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm border border-border bg-card" />
          not started
        </span>
        <span>Scroll sideways to follow a chain.</span>
      </div>

      {/* Wide content scrolls inside its own box; the page never scrolls
          horizontally. */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card p-2">
        <svg
          viewBox={`0 0 ${graph.width} ${graph.height}`}
          width={graph.width}
          height={graph.height}
          role="img"
          aria-label={`Prerequisite graph of ${graph.nodes.length} skills`}
          className="block"
        >
          <g stroke="var(--color-border)" fill="none" strokeWidth={1}>
            {graph.edges.map((e) => (
              <path key={`${e.from}->${e.to}`} d={e.path} />
            ))}
          </g>
          {graph.nodes.map((n) => {
            const ev = evidence.get(n.skill.id);
            const started = (ev?.completed ?? 0) > 0;
            return (
              <a
                key={n.skill.id}
                href={`/skills/${n.skill.id}`}
                aria-label={n.skill.name}
              >
                <rect
                  x={n.x}
                  y={n.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  fill="var(--color-card)"
                  stroke={
                    started ? "var(--color-accent)" : "var(--color-border)"
                  }
                  strokeWidth={started ? 1.5 : 1}
                />
                <text
                  x={n.x + 10}
                  y={n.y + (n.lines.length === 1 ? 24 : 17)}
                  fontSize={11}
                  fill="var(--color-foreground)"
                >
                  {n.lines.map((line, i) => (
                    <tspan key={line} x={n.x + 10} dy={i === 0 ? 0 : 13}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </a>
            );
          })}
        </svg>
      </div>

      <p className="mt-3 text-xs text-muted">
        Cycles are impossible here by construction — the corpus validator
        rejects one outright, because a skill that required something which
        required it back could never be started at all.
      </p>
    </div>
  );
}
