import type { Metadata } from "next";
import Link from "next/link";
import { programmeCalibration } from "@/server/calibration";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calibration",
  description:
    "Whether this learner's own scoring can be trusted — self-assessment against the panel, across every judged item.",
};

/** Below this, a mean is a number about three criteria pretending to be a finding. */
const ENOUGH = 10;

const signed = (n: number) => (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2));

export default async function CalibrationPage() {
  const c = programmeCalibration();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="text-sm text-stone-500 underline-offset-4 hover:underline"
      >
        Indie Degree
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Calibration</h1>
      <p className="mt-4 text-stone-600">
        Every judged item is scored twice: once by the learner, before seeing any
        verdict, and once by a panel of three models. The difference between
        those two numbers is the only figure here that measures judgement rather
        than effort.
      </p>
      <p className="mt-3 text-stone-600">
        A positive gap means scoring yourself above the panel. That is the
        direction worth watching, because it is the one an interview finds.
      </p>

      {c.comparable === 0 ? (
        <section className="mt-10 rounded border border-stone-200 bg-stone-50 p-6">
          <h2 className="font-medium">Nothing to compare yet</h2>
          <p className="mt-2 text-sm text-stone-600">
            {c.items.length === 0
              ? "No item has been judged. A comparison needs a submission, a self-score recorded before the verdict, and at least one judge's response pasted back."
              : `${c.items.length} item${c.items.length === 1 ? " has" : "s have"} a judgement, but no criterion yet has both a self score and a panel score.`}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            This page stays empty rather than showing a zero. A zero would read
            as perfect calibration, which is the opposite of no evidence.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              label="Mean gap"
              value={c.comparable >= ENOUGH ? signed(c.meanGap ?? 0) : "—"}
              note={
                c.comparable >= ENOUGH
                  ? "self minus panel"
                  : `needs ${ENOUGH}`
              }
            />
            <Stat
              label="Typical error"
              value={c.comparable >= ENOUGH ? (c.meanAbsGap ?? 0).toFixed(2) : "—"}
              note="levels, either way"
            />
            <Stat label="Criteria compared" value={String(c.comparable)} note="both sides" />
            <Stat label="Declined" value={String(c.declined)} note="not counted" />
          </section>

          {c.comparable < ENOUGH && (
            <p className="mt-4 text-sm text-stone-500">
              The means are withheld until {ENOUGH} criteria have been compared.
              An average over {c.comparable} is a statement about {c.comparable}{" "}
              criteria wearing the clothes of a finding.
            </p>
          )}

          <section className="mt-10">
            <h2 className="font-medium">Direction</h2>
            <div className="mt-3 flex gap-6 text-sm">
              <span>
                <strong className="text-lg">{c.over}</strong> over-rated
              </span>
              <span>
                <strong className="text-lg">{c.exact}</strong> agreed
              </span>
              <span>
                <strong className="text-lg">{c.under}</strong> under-rated
              </span>
            </div>
            {c.disagreements > 0 && (
              <p className="mt-3 text-sm text-stone-600">
                {c.disagreements} criteri{c.disagreements === 1 ? "on" : "a"} where
                the judges themselves differed by two levels or more. On those the
                panel median is a weak reference, and the gap says as much about
                the panel as about the learner.
              </p>
            )}
          </section>

          {c.byTier.length > 1 && (
            <section className="mt-10">
              <h2 className="font-medium">By evidence tier</h2>
              <table className="mt-3 w-full text-sm">
                <thead className="text-left text-stone-500">
                  <tr>
                    <th className="py-1 font-normal">Tier</th>
                    <th className="py-1 font-normal">Compared</th>
                    <th className="py-1 font-normal">Mean gap</th>
                  </tr>
                </thead>
                <tbody>
                  {c.byTier.map((t) => (
                    <tr key={t.tier} className="border-t border-stone-200">
                      <td className="py-1.5">{t.tier}</td>
                      <td className="py-1.5">{t.comparable}</td>
                      <td className="py-1.5 tabular-nums">
                        {t.meanGap === null ? "—" : signed(t.meanGap)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {c.overRated.length > 0 && (
            <Divergences
              title="Most over-rated"
              blurb="Where the learner scored highest above the panel. These are the claims to be most careful about."
              rows={c.overRated}
            />
          )}

          {c.underRated.length > 0 && (
            <Divergences
              title="Most under-rated"
              blurb="Scored below the panel. Worth knowing too: under-rating is miscalibration, and it hides work that was actually good."
              rows={c.underRated}
            />
          )}
        </>
      )}

      {c.items.length > 0 && (
        <section className="mt-10">
          <h2 className="font-medium">Every judged item</h2>
          <p className="mt-1 text-sm text-stone-500">
            Oldest first. No trend is fitted — with this many items a direction
            would be noise with a line through it.
          </p>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-stone-500">
              <tr>
                <th className="py-1 font-normal">Item</th>
                <th className="py-1 font-normal">Tier</th>
                <th className="py-1 font-normal">Judges</th>
                <th className="py-1 font-normal">Gap</th>
              </tr>
            </thead>
            <tbody>
              {c.items.map((i) => (
                <tr key={i.key} className="border-t border-stone-200">
                  <td className="py-1.5">
                    <Link
                      href={`/courses/${i.courseId}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {i.title}
                    </Link>
                    <span className="ml-2 text-stone-400">{i.itemId}</span>
                  </td>
                  <td className="py-1.5">{i.tier}</td>
                  <td className="py-1.5">{i.judges}</td>
                  <td className="py-1.5 tabular-nums">
                    {i.meanGap === null ? "—" : signed(i.meanGap)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
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
  note: string;
}) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-sm text-stone-600">{label}</div>
      <div className="text-xs text-stone-400">{note}</div>
    </div>
  );
}

function Divergences({
  title,
  blurb,
  rows,
}: {
  title: string;
  blurb: string;
  rows: {
    key: string;
    title: string;
    criterionId: string;
    criterion: string;
    self: number;
    panel: number;
    gap: number;
  }[];
}) {
  return (
    <section className="mt-10">
      <h2 className="font-medium">{title}</h2>
      <p className="mt-1 text-sm text-stone-500">{blurb}</p>
      <ul className="mt-3 space-y-3">
        {rows.map((d) => (
          <li
            key={`${d.key}:${d.criterionId}`}
            className="border-t border-stone-200 pt-3 text-sm"
          >
            <div className="flex items-baseline justify-between gap-4">
              <span>{d.criterion}</span>
              <span className="shrink-0 tabular-nums text-stone-500">
                self {d.self} · panel {d.panel} ·{" "}
                <strong>{signed(d.gap)}</strong>
              </span>
            </div>
            <div className="text-xs text-stone-400">{d.title}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
