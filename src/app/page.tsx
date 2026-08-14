import type { Metadata } from "next";
import Link from "next/link";
import {
  courses,
  getSpec,
  programme,
  specifiedCourses,
} from "@/server/curriculum";
import { getProgress, nextItem } from "@/server/progress";
import { isOwner } from "@/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Indie Degree",
  description:
    "A self-directed AI Engineering programme — courses, progress and what to do next.",
};

export default async function IndieDegreePage() {
  const progress = getProgress();
  const next = nextItem();
  const nextSpec = next ? getSpec(next.courseId) : undefined;
  const nextItemSpec = nextSpec?.modules
    .flatMap((m) => m.items)
    .find((i) => i.id === next?.itemId);

  const b = progress.banked;
  const specified = specifiedCourses();
  const owner = await isOwner();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Indie Degree</h1>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
          {programme.title}
        </span>
      </div>
      <p className="mt-2 text-muted">
        A self-directed programme. Progress is banked and only ever goes up —
        there is no streak to break.
      </p>

      {!owner && (
        <p className="mt-3 text-sm text-muted">
          You are reading someone else&apos;s transcript. It is public on
          purpose — a credential nobody can inspect is not a credential — and
          only its owner can tick anything off.
        </p>
      )}

      {/* Cold start: after a month away, one thing you can pick up now. */}
      {next && nextItemSpec && (
        <Link
          href={`/courses/${next.courseId}#${next.itemId}`}
          className="mt-8 block rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent"
        >
          <p className="text-xs uppercase tracking-wider text-accent">
            Pick up here
          </p>
          <p className="mt-1 text-lg font-medium">{nextItemSpec.title}</p>
          <p className="mt-1 text-sm text-muted">
            {next.courseId} · {nextItemSpec.type} ·{" "}
            {nextItemSpec.est_minutes} min — one sitting
          </p>
        </Link>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        <Stat label="Hours logged" value={b.hoursLogged.toString()} />
        <Stat label="Items complete" value={b.itemsComplete.toString()} />
        <Stat
          label="Credits"
          value={`${b.creditsEarned} / ${b.creditsAvailable}`}
        />
        <Stat label="Hours remaining" value={b.requiredHoursRemaining.toString()} />
      </dl>

      <p className="mt-3 text-sm text-muted">
        {b.weeklyHours === null ? (
          <>
            No projection yet — it needs at least two weeks of logged hours, and
            a rate guessed from one sitting would be fiction.
          </>
        ) : (
          <>
            Averaging <strong className="text-foreground">{b.weeklyHours}h</strong>{" "}
            a week.{" "}
            {b.projection && (
              <>
                At that rate the remaining required work lands in roughly{" "}
                <strong className="text-foreground">
                  {b.projection.fastWeeks}–{b.projection.slowWeeks} weeks
                </strong>
                . A band around your own measured pace, not a statistical
                interval.
              </>
            )}
          </>
        )}
      </p>

      <h2 className="mt-12 border-b border-border pb-2 text-lg font-semibold tracking-tight">
        Block I — in study order
      </h2>

      <ul className="mt-4 space-y-2">
        {specified.map((c) => {
          const cp = progress.courses[c.id];
          const pct = cp?.requiredItems
            ? Math.round((cp.completeItems / cp.requiredItems) * 100)
            : 0;
          return (
            <li key={c.id}>
              <Link
                href={`/courses/${c.id}`}
                className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    <span className="font-mono text-xs text-muted">
                      {c.value_rank}. {c.id}
                    </span>{" "}
                    {c.title}
                  </p>
                  <p className="text-xs text-muted">
                    {c.credits} credits · {c.est_hours}h
                    {c.advanced_standing !== "none" &&
                      ` · ${c.advanced_standing} standing`}
                  </p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {cp?.completeItems ?? 0}/{cp?.requiredItems ?? 0} items
                  {cp?.earned && " · complete"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      {courses.length > specified.length && (
        <p className="mt-6 text-sm text-muted">
          Block II is mapped but not yet specified —{" "}
          {courses.length - specified.length} courses, deliberately left until
          Block I has been studied rather than designed.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
