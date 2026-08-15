import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArea } from "@/server/curriculum";
import { capabilityStatus } from "@/server/capabilities";
import { getProgress } from "@/server/progress";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ area: string }>;
}): Promise<Metadata> {
  const { area } = await params;
  const a = getArea(area);
  return {
    title: a ? (a.cv_line ?? a.name) : "Indie Degree",
    description: a?.claim,
  };
}

/**
 * The page a CV links to.
 *
 * Its job is to be checkable by a stranger in under a minute: the claim, what
 * was required, what exists, and — the part that makes it worth reading — what
 * is still missing, said plainly rather than hidden behind a percentage.
 */
export default async function CapabilityPage({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  const { area: areaId } = await params;
  const area = getArea(areaId);
  if (!area) notFound();

  const status = capabilityStatus(area, getProgress());

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/capabilities"
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Capabilities
      </Link>

      <div className="mt-6 flex flex-wrap items-baseline gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {area.cv_line ?? area.name}
        </h1>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs ${
            status.met
              ? "border-accent text-accent"
              : "border-border text-muted"
          }`}
        >
          {status.met ? "earned" : "not yet earned"}
        </span>
      </div>

      {area.claim && (
        <p className="mt-6 border-l-2 border-accent pl-4 text-muted">
          {area.claim}
        </p>
      )}

      {!area.claimable && area.supporting_note && (
        <p className="mt-4 text-sm text-muted">{area.supporting_note}</p>
      )}

      {!status.reachable && area.claimable && (
        <p className="mt-4 rounded-md border border-border bg-card p-4 text-sm text-muted">
          No specified course teaches this yet, so it is unearnable rather than
          unearned. It needs its Block II course written first.
        </p>
      )}

      {status.requirements.length > 0 && (
        <div className="mt-10">
          <h2 className="border-b border-border pb-2 text-lg font-semibold tracking-tight">
            What this claim costs
          </h2>
          <ul className="mt-4 space-y-3">
            {status.requirements.map((r) => (
              <li key={r.label} className="flex gap-3">
                <span
                  aria-hidden
                  className={`mt-0.5 shrink-0 font-mono text-sm ${
                    r.met ? "text-accent" : "text-muted"
                  }`}
                >
                  {r.met ? "☑" : "☐"}
                </span>
                <span className="text-sm">
                  <span className={r.met ? "text-foreground" : "text-foreground"}>
                    {r.label}
                  </span>
                  {r.gap && (
                    <span className="mt-0.5 block text-xs text-muted">
                      {r.gap}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {area.artifact && (
        <div className="mt-10">
          <h2 className="border-b border-border pb-2 text-lg font-semibold tracking-tight">
            The proof
          </h2>
          <p className="mt-4 text-sm font-medium">
            {area.artifact.url ? (
              <a
                href={area.artifact.url}
                className="text-accent hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {area.artifact.name}
              </a>
            ) : (
              <span className="text-muted">{area.artifact.name}</span>
            )}
          </p>
          <p className="mt-1 text-sm text-muted">{area.artifact.what}</p>
          <p className="mt-3 text-sm">
            <span className="font-medium">Where it stops working. </span>
            <span className="text-muted">
              {area.artifact.negative_result ??
                "Not established yet. Anyone can ship a demo; the boundary is the part that is worth reading, so this claim is not earned until it is written down."}
            </span>
          </p>
        </div>
      )}

      <div className="mt-10">
        <h2 className="border-b border-border pb-2 text-lg font-semibold tracking-tight">
          Skills underneath
        </h2>
        <ul className="mt-4 space-y-1 text-sm text-muted">
          {status.skills.map((s) => (
            <li key={s.id}>
              {s.name}
              {s.note && <span className="text-xs"> — {s.note}</span>}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          {status.assessed} assessed items across the specified courses evidence
          these, {status.completed} done.
        </p>
      </div>
    </div>
  );
}
