"use client";

import { useState } from "react";
import type { Item, Rubric } from "./types";

/**
 * The evidence loop, in the order the evidence has to be produced.
 *
 * Three stages, and the gating between them is the design rather than
 * ceremony. You explain how each checkpoint was satisfied, you score yourself
 * against the rubric, and only then do you record what the judges said. The
 * server refuses a judgement before a self-assessment exists, so the ordering
 * survives the temptation to skip it.
 *
 * Loaded on demand: 244 assessed items in the programme, and fetching every
 * assessment to render one course page would be absurd.
 */

export interface CriterionCalibration {
  criterionId: string;
  criterion: string;
  self: number | null;
  panel: number | null;
  gap: number | null;
  spread: number | null;
  declined: number;
}

interface Assessment {
  submission: {
    explanations: Record<string, string>;
    artifactUrl: string | null;
    submittedAt: string | null;
  } | null;
  cold: { outcome: "passed" | "missed"; attemptedAt: string } | null;
  selfScores: Record<string, number>;
  judgements: { id: number; judge: string; pastedAt: string }[];
  calibration: CriterionCalibration[];
  meanGap: number | null;
  weakest: CriterionCalibration | null;
}

const JUDGES = ["claude", "chatgpt", "gemini"] as const;

export function SubmissionPanel({
  courseId,
  item,
  rubric,
  canEdit,
}: {
  courseId: string;
  item: Item;
  rubric: Rubric;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Assessment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [artifactUrl, setArtifactUrl] = useState("");
  const [self, setSelf] = useState<Record<string, number>>({});
  const [judge, setJudge] = useState<string>(JUDGES[0]);
  const [judgeText, setJudgeText] = useState("");

  async function load() {
    const r = await fetch(
      `/api/submission?courseId=${courseId}&itemId=${item.id}`,
    );
    if (!r.ok) return;
    const a = (await r.json()) as Assessment;
    setData(a);
    setExplanations(a.submission?.explanations ?? {});
    setArtifactUrl(a.submission?.artifactUrl ?? "");
    setSelf(a.selfScores);
  }

  async function post(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, itemId: item.id, ...payload }),
      });
      const body = (await r.json()) as Assessment & { error?: string };
      if (!r.ok) {
        setError(body.error ?? "that did not work");
        return;
      }
      setData(body);
      setSelf(body.selfScores);
    } finally {
      setBusy(false);
    }
  }

  const checkpoints = item.checkpoints ?? [];
  const selfComplete =
    data !== null && Object.keys(data.selfScores).length === rubric.criteria.length;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && !data) void load();
        }}
        className="text-xs font-medium text-accent hover:underline"
      >
        {open ? "Hide submission" : "Submission and assessment"}
      </button>

      {open && (
        <div className="mt-2 space-y-6 rounded-md border border-border bg-background p-3">
          {error && (
            <p className="rounded border border-border bg-card p-2 text-xs text-foreground">
              {error}
            </p>
          )}

          {/* 0 — try it before reading anything.
              Tier 1 only: its preconditions are objective, so whether you
              passed is a fact you can check rather than a judgement you can
              flatter. Above tier 1 this would mean convening a three-model
              panel before every reading, which costs more than the reading. */}
          {item.tier === 1 && (
            <section className="rounded border border-border bg-card p-3">
              <h4 className="text-xs font-medium text-foreground">
                0. Try it before you read anything
              </h4>
              <p className="mt-1 text-xs text-muted">
                The preconditions on this item are objective, so you can find out
                in one sitting whether you need the material at all. Missing is
                not a failure and is not scored — it is the cheapest way to learn
                which reading is worth your time.
              </p>
              {data?.cold ? (
                <p className="mt-2 text-xs">
                  {data.cold.outcome === "passed" ? (
                    <span className="text-accent">
                      Passed cold on {data.cold.attemptedAt.slice(0, 10)} — the
                      readings in this module are optional for you. Still finish
                      the item itself; a cold pass marks material skippable, not
                      the skill demonstrated.
                    </span>
                  ) : (
                    <span className="text-muted">
                      Attempted cold on {data.cold.attemptedAt.slice(0, 10)} and
                      missed. The readings in this module are now targeted rather
                      than general — you know what you are looking for.
                    </span>
                  )}
                </p>
              ) : (
                canEdit && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void post({ action: "cold", outcome: "passed" })}
                      className="rounded border border-border px-2 py-1 text-xs hover:border-accent"
                    >
                      I passed it cold
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void post({ action: "cold", outcome: "missed" })}
                      className="rounded border border-border px-2 py-1 text-xs hover:border-accent"
                    >
                      I tried and missed
                    </button>
                  </div>
                )
              )}
            </section>
          )}

          {/* 1 — the work, explained checkpoint by checkpoint */}
          <section>
            <h4 className="text-xs font-medium text-foreground">
              1. What you did, checkpoint by checkpoint
            </h4>
            <p className="mt-1 text-xs text-muted">
              Explaining how each one was satisfied is the point, not a record of
              it. Writing the explanation is where most of the learning in this
              step happens.
            </p>
            {checkpoints.length === 0 && (
              <p className="mt-2 text-xs text-muted">
                This item declares no checkpoints — describe the work as a whole.
              </p>
            )}
            <div className="mt-2 space-y-2">
              {(checkpoints.length ? checkpoints : ["The work"]).map((cp, i) => (
                <label key={cp} className="block">
                  <span className="text-xs text-muted">{cp}</span>
                  <textarea
                    rows={2}
                    disabled={!canEdit || busy}
                    value={explanations[String(i)] ?? ""}
                    onChange={(e) =>
                      setExplanations({ ...explanations, [String(i)]: e.target.value })
                    }
                    className="mt-1 w-full rounded border border-border bg-card p-2 text-xs text-foreground disabled:opacity-60"
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-xs text-muted">
                  Artifact URL — the repo, document or deployed thing, if there is one
                </span>
                <input
                  type="url"
                  disabled={!canEdit || busy}
                  value={artifactUrl}
                  onChange={(e) => setArtifactUrl(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-card p-2 text-xs text-foreground disabled:opacity-60"
                />
              </label>
            </div>
            {canEdit && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void post({ action: "submission", explanations, artifactUrl })}
                  className="rounded border border-border px-2 py-1 text-xs hover:border-accent"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void post({ action: "submission", explanations, artifactUrl, submit: true })
                  }
                  className="rounded border border-border px-2 py-1 text-xs hover:border-accent"
                >
                  Mark submitted
                </button>
                {data?.submission?.submittedAt && (
                  <span className="self-center text-xs text-muted">
                    submitted {data.submission.submittedAt.slice(0, 10)}
                  </span>
                )}
              </div>
            )}
          </section>

          {/* 2 — your own score, before anyone else's */}
          <section className="border-t border-border pt-4">
            <h4 className="text-xs font-medium text-foreground">
              2. Score yourself, before the panel
            </h4>
            <p className="mt-1 text-xs text-muted">
              Do this before reading any judge. Seeing a verdict first makes the
              work feel assessed without teaching you anything, and it destroys
              the only measurement here that tracks judgement rather than effort.
            </p>
            <div className="mt-2 space-y-2">
              {rubric.criteria.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 flex-1 text-xs text-muted">{c.criterion}</span>
                  {[0, 1, 2, 3].map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      disabled={!canEdit || busy}
                      onClick={() => setSelf({ ...self, [c.id]: lv })}
                      aria-pressed={self[c.id] === lv}
                      className={`h-6 w-6 rounded border text-xs ${
                        self[c.id] === lv
                          ? "border-accent text-accent"
                          : "border-border text-muted"
                      } disabled:opacity-60`}
                    >
                      {lv}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            {canEdit && (
              <button
                type="button"
                disabled={busy || Object.keys(self).length !== rubric.criteria.length}
                onClick={() => void post({ action: "self", scores: self })}
                className="mt-2 rounded border border-border px-2 py-1 text-xs hover:border-accent disabled:opacity-50"
              >
                Record my assessment
              </button>
            )}
          </section>

          {/* 3 — what the judges said */}
          <section className="border-t border-border pt-4">
            <h4 className="text-xs font-medium text-foreground">
              3. What the judges said
            </h4>
            {!selfComplete ? (
              <p className="mt-1 text-xs text-muted">
                Locked until you have scored yourself on every criterion. The lock
                is the feature.
              </p>
            ) : (
              <>
                <p className="mt-1 text-xs text-muted">
                  Paste each reply whole. The per-criterion levels are read out of
                  the SCORES block; the full text is kept so a better parser can
                  re-read it later.
                </p>
                {canEdit && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      {JUDGES.map((j) => (
                        <button
                          key={j}
                          type="button"
                          onClick={() => setJudge(j)}
                          aria-pressed={judge === j}
                          className={`rounded border px-2 py-1 text-xs ${
                            judge === j
                              ? "border-accent text-accent"
                              : "border-border text-muted"
                          }`}
                        >
                          {j}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={4}
                      disabled={busy}
                      placeholder={`Paste ${judge}'s reply`}
                      value={judgeText}
                      onChange={(e) => setJudgeText(e.target.value)}
                      className="w-full rounded border border-border bg-card p-2 font-mono text-xs text-foreground"
                    />
                    <button
                      type="button"
                      disabled={busy || !judgeText.trim()}
                      onClick={async () => {
                        await post({ action: "judgement", judge, text: judgeText });
                        setJudgeText("");
                      }}
                      className="rounded border border-border px-2 py-1 text-xs hover:border-accent disabled:opacity-50"
                    >
                      Record {judge}
                    </button>
                  </div>
                )}
                {data && data.judgements.length > 0 && (
                  <p className="mt-2 text-xs text-muted">
                    Recorded: {data.judgements.map((j) => j.judge).join(", ")}
                  </p>
                )}
              </>
            )}
          </section>

          {/* 4 — the gap, which is the actual result */}
          {data && data.meanGap !== null && (
            <section className="border-t border-border pt-4">
              <h4 className="text-xs font-medium text-foreground">Calibration</h4>
              <p className="mt-1 text-xs text-muted">
                {data.meanGap > 0.5
                  ? "You scored yourself above the panel. That gap closing over time is what improving judgement looks like."
                  : data.meanGap < -0.5
                    ? "You scored yourself below the panel — worth checking whether you are underrating the work or they are being generous."
                    : "Your scoring and the panel's agree closely. That is the outcome worth having."}
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted">
                    <tr>
                      <th className="py-1 text-left font-normal">Criterion</th>
                      <th className="px-2 py-1 text-right font-normal">You</th>
                      <th className="px-2 py-1 text-right font-normal">Panel</th>
                      <th className="px-2 py-1 text-right font-normal">Gap</th>
                      <th className="px-2 py-1 text-right font-normal">Spread</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.calibration.map((c) => (
                      <tr key={c.criterionId} className="border-t border-border">
                        <td className="py-1 pr-2 text-muted">{c.criterion}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{c.self ?? "—"}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{c.panel ?? "—"}</td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          {c.gap === null ? "—" : c.gap > 0 ? `+${c.gap}` : c.gap}
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          {c.spread === null ? "—" : c.spread >= 2 ? `${c.spread} ⚠` : c.spread}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.calibration.some((c) => (c.spread ?? 0) >= 2) && (
                <p className="mt-2 text-xs text-muted">
                  A spread of 2 or more means the judges genuinely disagreed. Read
                  their reasoning rather than the median — the disagreement is
                  usually about how the criterion is worded, not about your work.
                </p>
              )}
              {data.weakest && (
                <p className="mt-3 text-xs">
                  <span className="font-medium text-foreground">Where to next. </span>
                  <span className="text-muted">
                    The panel scored <em>{data.weakest.criterion}</em> lowest
                    {data.weakest.panel !== null && ` (${data.weakest.panel})`}. That
                    is the one thing to change before the next item of this kind.
                  </span>
                </p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
