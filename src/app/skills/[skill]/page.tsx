import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArea, getSkill, resourceUrl, resources } from "@/server/curriculum";
import { dependentsOf } from "@/server/skillGraph";
import { itemsForSkill } from "@/server/capabilities";
import { getProgress } from "@/server/progress";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ skill: string }>;
}): Promise<Metadata> {
  const { skill } = await params;
  const s = getSkill(skill);
  return { title: s ? s.name : "Indie Degree" };
}

export default async function SkillPage({
  params,
}: {
  params: Promise<{ skill: string }>;
}) {
  const { skill: skillId } = await params;
  const skill = getSkill(skillId);
  if (!skill) notFound();

  const area = getArea(skill.area);
  const progress = getProgress();
  const evidence = itemsForSkill(skill.id);
  const done = evidence.filter(
    (e) => progress.items[`${e.courseId}/${e.item.id}`]?.status === "complete",
  ).length;
  const dependents = dependentsOf(skill.id);
  const teaches = [...resources.values()].filter((r) =>
    r.skills?.includes(skill.id),
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/skills"
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Skill graph
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        {skill.name}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Part of{" "}
        {area?.claimable ? (
          <Link href={`/capabilities/${area.id}`} className="text-accent hover:underline">
            {area.cv_line ?? area.name}
          </Link>
        ) : (
          (area?.name ?? skill.area)
        )}
      </p>

      {skill.note && (
        <p className="mt-6 border-l-2 border-accent pl-4 text-muted">
          {skill.note}
        </p>
      )}

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium">Needs first</h2>
          {skill.prereqs.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Nothing — this is a starting point.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {skill.prereqs.map((p) => (
                <li key={p}>
                  <Link href={`/skills/${p}`} className="text-accent hover:underline">
                    {getSkill(p)?.name ?? p}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="text-sm font-medium">Unlocks</h2>
          {dependents.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Nothing depends on this one.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {dependents.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/skills/${d.id}`}
                    className="text-accent hover:underline"
                  >
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="border-b border-border pb-2 text-lg font-semibold tracking-tight">
          Where it is assessed
        </h2>
        <p className="mt-3 text-sm text-muted">
          {evidence.length} assessed items, {done} done.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {evidence.map((e) => (
            <li key={`${e.courseId}/${e.item.id}`}>
              <Link
                href={`/courses/${e.courseId}#${e.item.id}`}
                className="hover:text-accent"
              >
                <span className="font-mono text-xs text-muted">
                  {e.courseId} {e.item.id}
                </span>{" "}
                {e.item.title}
                <span className="text-xs text-muted"> · tier {e.item.tier}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {teaches.length > 0 && (
        <div className="mt-10">
          <h2 className="border-b border-border pb-2 text-lg font-semibold tracking-tight">
            Verified sources
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            {teaches.map((r) => {
              const url = resourceUrl(r);
              return (
                <li key={r.id}>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-accent"
                    >
                      {r.title}
                    </a>
                  ) : (
                    r.title
                  )}
                  {r.verification?.observed_author && (
                    <span className="text-xs text-muted">
                      {" "}
                      · {r.verification.observed_author}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
