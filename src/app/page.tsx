import type { Metadata } from "next";
import Link from "next/link";
import {
  blocks,
  courses,
  getSpec,
  programme,
  specifiedCourses,
} from "@/server/curriculum";
import { getProgress, nextItem } from "@/server/progress";
import { claimable } from "@/server/capabilities";
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
  const claims = claimable(progress);
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

      {/* Evidence first, hours last.
          Hours are a planning estimate, not an achievement — 300 hours of
          reading and 120 hours that shipped four things are not the same
          transcript, and the old dashboard scored them identically. Credits are
          the degree metaphor and belong below the thing they are a proxy for. */}
      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        <Stat
          label="Demonstrated"
          value={`${b.evidenceComplete} / ${b.evidenceAvailable}`}
          note="assessed work"
        />
        <Stat
          label="Capabilities"
          value={`${claims.filter((c) => c.met).length} / ${claims.length}`}
          note="CV lines earned"
        />
        <Stat
          label="Artifacts"
          value={b.artifactsShipped.toString()}
          note="public, tier 3"
        />
        <Stat
          label="Defended"
          value={b.defended.toString()}
          note="aloud, tier 4"
        />
      </dl>

      <p className="mt-3 text-sm text-muted">
        Read and watched:{" "}
        <strong className="text-foreground">
          {Object.values(progress.courses).reduce((n, c) => n + c.exposureComplete, 0)}
        </strong>{" "}
        of{" "}
        {Object.values(progress.courses).reduce((n, c) => n + c.exposureItems, 0)}{" "}
        items. Tracked, and deliberately counted apart from the figures above —
        exposure is how you close a gap, not evidence that it closed.
      </p>

      <p className="mt-3 text-sm text-muted">
        <span className="text-foreground">
          {b.creditsEarned} of {b.creditsAvailable} credits
        </span>{" "}
        · {b.hoursLogged}h logged · {b.requiredHoursRemaining}h of required work
        left. Planning figures, kept below the ones that mean something.{" "}
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

      {/* The claims are the point; the courses are how they get earned. Listed
          first because a reader wants to know what this buys before how long
          it takes. */}
      <Link
        href="/capabilities"
        className="mt-10 block rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent"
      >
        <p className="text-xs uppercase tracking-wider text-accent">
          What this is for
        </p>
        <p className="mt-1 text-lg font-medium">
          {claims.filter((c) => c.met).length} of {claims.length} capabilities
          earned
        </p>
        <p className="mt-1 text-sm text-muted">
          Each one is a line you could put in a CV — and the evidence it would
          take to defend it to someone who sets the questions.
        </p>
      </Link>

      <Link
        href="/skills"
        className="mt-3 block rounded-lg border border-border bg-card p-4 text-sm transition-colors hover:border-accent"
      >
        <span className="font-medium">The skill graph</span>
        <span className="text-muted">
          {" "}
          — 75 skills, 93 prerequisites, eight levels deep. What has to come
          before what.
        </span>
      </Link>

      {/* Grouped by block rather than listed flat. The heading used to be a
          hardcoded "Block I", which was true only while Block I was the only
          specified block — the first Block II course to land would have been
          filed under the wrong heading with nothing to catch it. */}
      {blocks.map((block) => {
        const inBlock = specified.filter((c) => c.block === block.id);
        if (inBlock.length === 0) return null;
        const total = courses.filter((c) => c.block === block.id).length;
        return (
          <section key={block.id}>
            <h2 className="mt-12 border-b border-border pb-2 text-lg font-semibold tracking-tight">
              {block.title} — in study order
            </h2>
            <p className="mt-2 text-sm text-muted">
              {block.purpose}
              {inBlock.length < total &&
                ` ${inBlock.length} of ${total} specified so far.`}
            </p>
            {/* Without this, "3. AIE-107" above "4. AIE-105" reads as a sorting
                bug. It is the opposite: the codes are catalogue numbers and the
                study order is value-weighted, so they are meant to disagree. */}
            <p className="mt-1 text-xs text-muted">
              Numbered by study order, which deliberately does not follow the
              course codes — the sequence is value-weighted within prerequisite
              constraints, so stopping at any point leaves the highest-value
              skills already banked.
            </p>

            <ul className="mt-4 space-y-2">
              {inBlock.map((c) => {
                const cp = progress.courses[c.id];
                // The bar tracks evidence, not exposure. A bar that filled up
                // from readings alone would say "nearly done" to someone who
                // had demonstrated nothing.
                const pct = cp?.evidenceItems
                  ? Math.round((cp.evidenceComplete / cp.evidenceItems) * 100)
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
                  {cp?.evidenceComplete ?? 0}/{cp?.evidenceItems ?? 0} demonstrated
                  {" · "}
                  {cp?.exposureComplete ?? 0}/{cp?.exposureItems ?? 0} read
                  {cp?.earned && " · complete"}
                </p>
              </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {courses.length > specified.length && (
        <p className="mt-6 text-sm text-muted">
          {courses.length - specified.length} of the {courses.length} mapped
          courses are not specified yet. They carry credits, hours and
          prerequisites, but no items — so they are visible in the totals and
          unstudiable, which is the honest state rather than a hidden one.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="bg-card px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-xl font-semibold tabular-nums">{value}</dd>
      {note && <p className="text-[11px] text-muted">{note}</p>}
    </div>
  );
}
