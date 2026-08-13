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

      <div className="mt-10">
        <CourseBoard
          courseId={course.id}
          spec={spec}
          links={links}
          initial={progress}
        />
      </div>
    </div>
  );
}
