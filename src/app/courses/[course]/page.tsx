import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCourse,
  getSpec,
  resources,
  resourceUrl,
} from "@/server/curriculum";
import { getProgress } from "@/server/progress";
import { capabilitiesOf } from "@/server/capabilities";
import { isOwner } from "@/auth";
import {
  CourseBoard,
  type ResourceLink,
} from "@/products/CourseBoard";

// Progress changes on every interaction, so there is nothing worth caching.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course: string }>;
}): Promise<Metadata> {
  const { course } = await params;
  const c = getCourse(course);
  return {
    title: c ? `${c.id} · ${c.title}` : "Indie Degree",
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course: courseId } = await params;
  const course = getCourse(courseId);
  const spec = getSpec(courseId);
  if (!course || !spec) notFound();

  const progress = getProgress();
  const caps = capabilitiesOf(course.id, progress);
  const cp = progress.courses[course.id];

  // The first assessed item not yet done. "Where to next" at course level,
  // rather than leaving the reader to scan 38 rows for it.
  const next = spec.modules
    .flatMap((m) => m.items)
    .find(
      (i) =>
        i.tier > 0 &&
        !i.optional &&
        progress.items[`${course.id}/${i.id}`]?.status !== "complete",
    );

  // Resolve every resource the spec cites once, on the server, so the client
  // component never needs the corpus.
  const links: Record<string, ResourceLink> = {};
  for (const m of spec.modules) {
    for (const item of m.items) {
      if (!item.resource || links[item.resource]) continue;
      const r = resources.get(item.resource);
      if (!r) continue;
      links[item.resource] = {
        title: r.title,
        url: resourceUrl(r),
        channel: r.verification?.observed_author,
      };
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Programme
      </Link>

      <div className="mt-6 flex flex-wrap items-baseline gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {course.title}
        </h1>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
          {course.id}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        {course.credits} credits · {course.est_hours}h required
        {spec.optional_hours ? ` · ${spec.optional_hours}h optional` : ""}
        {course.prereq_courses.length > 0 &&
          ` · after ${course.prereq_courses.join(", ")}`}
      </p>

      <p className="mt-6 border-l-2 border-accent pl-4 text-muted">
        {spec.premise}
      </p>

      {spec.laboratory && (
        <p className="mt-4 text-sm text-muted">
          <span className="font-medium text-foreground">The lab. </span>
          {spec.laboratory}
        </p>
      )}

      {course.outcomes.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium">By the end you can</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {course.outcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {/* What the course is for, before what it contains. A page that opens
          with "38 items, 45h" invites the reader to think about finishing a
          list; this answers the question they actually have. */}
      {caps.length > 0 && (
        <div className="mt-8 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium">What this builds</h2>
          <ul className="mt-3 space-y-2">
            {caps.map((c) => (
              <li key={c.areaId} className="flex flex-wrap items-baseline gap-2">
                <span className="min-w-0 flex-1 text-sm">
                  {c.claimable ? (
                    <Link
                      href={`/capabilities/${c.areaId}`}
                      className="text-accent hover:underline"
                    >
                      {c.name}
                    </Link>
                  ) : (
                    <span className="text-muted">{c.name}</span>
                  )}
                  {!c.claimable && (
                    <span className="text-xs text-muted"> · supporting</span>
                  )}
                </span>
                <span className="text-xs tabular-nums text-muted">
                  {c.done}/{c.items} demonstrated
                </span>
              </li>
            ))}
          </ul>
          {next && (
            <p className="mt-4 border-t border-border pt-3 text-sm">
              <span className="font-medium">Next assessment. </span>
              <a href={`#${next.id}`} className="text-accent hover:underline">
                {next.title}
              </a>
              <span className="text-muted">
                {" "}
                — {next.est_minutes} min, tier {next.tier}
                {next.tier === 1 &&
                  ". Machine-checkable, so you can attempt it before reading anything and find out whether you need to."}
              </span>
            </p>
          )}
        </div>
      )}

      <p className="mt-6 text-sm text-muted">
        <strong className="text-foreground">
          {cp?.evidenceComplete ?? 0}/{cp?.evidenceItems ?? 0}
        </strong>{" "}
        assessed items demonstrated ·{" "}
        {cp?.exposureComplete ?? 0}/{cp?.exposureItems ?? 0} read or watched. The
        second number is how you close a gap; only the first is evidence that it
        closed.
      </p>

      <div className="mt-10">
        <CourseBoard
          courseId={course.id}
          spec={spec}
          links={links}
          initial={progress}
          canEdit={await isOwner()}
        />
      </div>
    </div>
  );
}
