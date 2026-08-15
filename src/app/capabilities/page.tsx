import type { Metadata } from "next";
import Link from "next/link";
import { allCapabilities } from "@/server/capabilities";
import { getProgress } from "@/server/progress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // The layout supplies the "· Indie Degree" suffix via its title template.
  title: "Capabilities",
  description:
    "The claims this programme is trying to earn, and the evidence each one still needs.",
};

export default async function CapabilitiesPage() {
  const progress = getProgress();
  const all = allCapabilities(progress);
  const claims = all.filter((c) => c.area.claimable);
  const supporting = all.filter((c) => !c.area.claimable);
  const earned = claims.filter((c) => c.met).length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Programme
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Capabilities
      </h1>
      <p className="mt-2 text-muted">
        The unit that matters is not the credit — it is the line you are willing
        to put in the skills section of a CV and then defend to someone who sets
        the questions. Each of these says what it would take to earn it, and
        what is still missing.
      </p>
      <p className="mt-3 text-sm text-muted">
        <strong className="text-foreground">
          {earned} of {claims.length}
        </strong>{" "}
        earned. Most read mostly unmet, which is the system working rather than
        failing — a bar you can clear on the day you set it was never a bar.
      </p>

      <ul className="mt-8 space-y-2">
        {claims.map((c) => (
          <li key={c.area.id}>
            <Link
              href={`/capabilities/${c.area.id}`}
              className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{c.area.cv_line ?? c.area.name}</p>
                <p className="text-xs text-muted">
                  {c.met ? (
                    <span className="text-accent">earned</span>
                  ) : c.reachable ? (
                    `${c.requirements.filter((r) => r.met).length}/${c.requirements.length} requirements`
                  ) : (
                    "not yet teachable"
                  )}
                </p>
              </div>
              {c.area.claim && (
                <p className="mt-1 text-sm text-muted">{c.area.claim}</p>
              )}
              <p className="mt-2 text-xs text-muted">
                {c.skills.length} skills · {c.qualifying}/{c.assessed} assessed
                items done
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 border-b border-border pb-2 text-lg font-semibold tracking-tight">
        Supporting
      </h2>
      <p className="mt-3 text-sm text-muted">
        Load-bearing under the claims above, and deliberately not claims
        themselves — nobody is hired for a linear-algebra line, and this
        programme treats Python as the medium of instruction rather than an
        achievement.
      </p>
      <ul className="mt-4 space-y-2">
        {supporting.map((c) => (
          <li
            key={c.area.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="font-medium">{c.area.name}</p>
            {c.area.supporting_note && (
              <p className="mt-1 text-sm text-muted">
                {c.area.supporting_note}
              </p>
            )}
            <p className="mt-2 text-xs text-muted">{c.skills.length} skills</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
