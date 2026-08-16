"use client";

import { useState, useTransition } from "react";
import { gradingPrompt } from "./gradingPrompt";
import { SubmissionPanel } from "./SubmissionPanel";
import type {
  CourseSpec,
  Item,
  ItemProgress,
  ItemStatus,
  ProgressPayload,
  Rubric,
} from "./types";

export interface ResourceLink {
  title: string;
  url: string | null;
  channel?: string;
}

interface Props {
  courseId: string;
  spec: CourseSpec;
  links: Record<string, ResourceLink>;
  initial: ProgressPayload;
  /**
   * Whether this reader may change anything. Everyone reads; one account
   * writes. This only decides what gets rendered — the server checks again on
   * every write, because a hidden button is not a permission.
   */
  canEdit: boolean;
}

const TIER_LABEL: Record<number, string> = {
  0: "self-marked",
  1: "machine-verified",
  2: "panel-assessed",
  3: "artifact",
  4: "defended",
};

function minutes(n: number): string {
  if (n < 60) return `${n}m`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function CourseBoard({
  courseId,
  spec,
  links,
  initial,
  canEdit,
}: Props) {
  const [progress, setProgress] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const rubricById = new Map(spec.rubrics.map((r) => [r.id, r]));

  const key = (itemId: string) => `${courseId}/${itemId}`;
  const stateOf = (itemId: string): ItemProgress =>
    progress.items[key(itemId)] ?? {
      status: "not_started",
      minutes_logged: 0,
      checkpoints: [],
      completed_at: null,
    };

  async function send(payload: Record<string, unknown>, marker: string) {
    setBusy(marker);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, ...payload }),
      });
      if (res.ok) {
        const next = (await res.json()) as ProgressPayload;
        startTransition(() => setProgress(next));
      }
    } finally {
      setBusy(null);
    }
  }

  const cp = progress.courses[courseId];
  const pct = cp?.requiredItems
    ? Math.round((cp.completeItems / cp.requiredItems) * 100)
    : 0;

  return (
    <div className={pending ? "opacity-95 transition-opacity" : undefined}>
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-muted">
            <span className="font-medium text-foreground">
              {cp?.completeItems ?? 0} of {cp?.requiredItems ?? 0}
            </span>{" "}
            required items complete
          </p>
          <p className="text-sm text-muted">
            {minutes(cp?.completeMinutes ?? 0)} of{" "}
            {minutes(cp?.requiredMinutes ?? 0)}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {cp?.earned && (
          <p className="mt-3 text-sm font-medium text-accent">
            Course complete — {spec.credits} credits earned.
          </p>
        )}
      </div>

      {spec.modules.map((m) => {
        const done = m.items.filter(
          (i) => !i.optional && stateOf(i.id).status === "complete",
        ).length;
        const need = m.items.filter((i) => !i.optional).length;
        return (
          <section key={m.id} className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {m.id} · {m.title}
              </h2>
              <span className="text-xs text-muted">
                {done}/{need} · {minutes(m.est_minutes)}
              </span>
            </div>

            <ul className="mt-3 space-y-1">
              {m.items.map((item) => (
                <ItemRow
                  key={item.id}
                  courseId={courseId}
                  item={item}
                  state={stateOf(item.id)}
                  link={item.resource ? links[item.resource] : undefined}
                  rubric={item.rubric ? rubricById.get(item.rubric) : undefined}
                  panelSize={spec.panel?.models.length ?? 0}
                  expanded={open === item.id}
                  busy={busy}
                  canEdit={canEdit}
                  onToggleOpen={() =>
                    setOpen(open === item.id ? null : item.id)
                  }
                  onStatus={(status) =>
                    send({ itemId: item.id, status }, `s:${item.id}`)
                  }
                  onCheckpoint={(position) =>
                    send(
                      { itemId: item.id, checkpoint: position },
                      `c:${item.id}:${position}`,
                    )
                  }
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/**
 * What the work is judged against, shown BEFORE it is done.
 *
 * The rubric is registered before any submission exists — that is what makes a
 * grade fair. Its value to the person doing the work is different and just as
 * real: knowing what "3" looks like before starting. Keeping it in a JSON file
 * threw that half away and left an assignment looking like a checkbox with a
 * paragraph attached.
 */
function RubricPanel({
  item,
  rubric,
  panelSize,
}: {
  item: Item;
  rubric: Rubric;
  panelSize: number;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);
  const blocking = rubric.preconditions?.filter((c) => c.blocking) ?? [];
  const advisory = rubric.preconditions?.filter((c) => !c.blocking) ?? [];

  // The clipboard API is refused in plenty of ordinary situations — an
  // insecure origin, a permissions policy, an embedded view. Falling back to a
  // selectable textarea means the button always produces the text, rather than
  // appearing to do nothing.
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(gradingPrompt(item, rubric));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFallback(true);
    }
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs font-medium text-accent hover:underline"
      >
        {open ? "Hide" : "How this is graded"}
        {!open && rubric.criteria.length > 0 && (
          <span className="font-normal text-muted">
            {" "}
            · {rubric.criteria.length} criteria
            {blocking.length > 0 && `, ${blocking.length} preconditions`}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-4 rounded-md border border-border bg-background p-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
            <button
              type="button"
              onClick={copyPrompt}
              className="rounded border border-border px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              {copied ? "Copied" : "Copy grading prompt"}
            </button>
            <span className="text-xs text-muted">
              Paste into a fresh chat with each judge, then add your work.
            </span>
          </div>

          {fallback && (
            <div>
              <p className="mb-1 text-xs text-muted">
                The browser refused clipboard access. Select all and copy:
              </p>
              <textarea
                readOnly
                rows={12}
                value={gradingPrompt(item, rubric)}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded border border-border bg-surface p-2 font-mono text-xs text-foreground"
              />
            </div>
          )}

          {blocking.length > 0 && (
            <div>
              {/* Named "preconditions" rather than "checks that run": of 141 in
                  this programme only 3 are expressible as a comparison. The
                  rest are conditions a human confirms. Calling them automatic
                  promised an automation that does not exist. */}
              <p className="text-xs font-medium text-foreground">
                Preconditions — must hold before the work is judged
              </p>
              <ul className="mt-1 space-y-1">
                {blocking.map((c) => (
                  <li key={c.check} className="flex gap-2 text-xs text-muted">
                    <span className="shrink-0 text-accent">▪</span>
                    <code className="font-mono">{c.check}</code>
                  </li>
                ))}
              </ul>
              {advisory.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {advisory.map((c) => (
                    <li key={c.check} className="flex gap-2 text-xs text-muted">
                      <span className="shrink-0">▫</span>
                      <code className="font-mono">{c.check}</code>
                      <span className="italic">not blocking</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {rubric.criteria.map((c) => (
            <div key={c.id}>
              <p className="text-xs font-medium text-foreground">
                <span className="mr-1.5 rounded bg-foreground/5 px-1.5 py-0.5 tabular-nums text-muted">
                  {Math.round(c.weight * 100)}%
                </span>
                {c.criterion}
              </p>
              <dl className="mt-1 space-y-0.5">
                {["0", "1", "2", "3"].map((lvl) => (
                  <div key={lvl} className="flex gap-2 text-xs">
                    <dt
                      className={`shrink-0 font-mono ${
                        lvl === "3" ? "text-accent" : "text-muted"
                      }`}
                    >
                      {lvl}
                    </dt>
                    <dd
                      className={lvl === "3" ? "text-foreground" : "text-muted"}
                    >
                      {c.levels[lvl]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          {rubric.anti_gaming && (
            <p className="border-l-2 border-accent pl-2 text-xs text-muted">
              <span className="font-medium text-foreground">Anti-gaming. </span>
              {rubric.anti_gaming}
            </p>
          )}
          {rubric.integrity && (
            <p className="border-l-2 border-accent pl-2 text-xs text-muted">
              <span className="font-medium text-foreground">Integrity. </span>
              {rubric.integrity}
            </p>
          )}

          <p className="text-xs text-muted">
            {panelSize > 0
              ? `Scored by ${panelSize} judges independently and blind, against this rubric — registered before the submission exists, and frozen into it on submit so a later edit cannot change a grade already given. Disagreement is shown as a spread, never averaged away.`
              : "Registered before the submission exists."}{" "}
            <span className="italic">
              Submission and grading are not built yet; this is what the work
              will be measured against.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

function ItemRow({
  courseId,
  item,
  state,
  link,
  rubric,
  panelSize,
  expanded,
  busy,
  canEdit,
  onToggleOpen,
  onStatus,
  onCheckpoint,
}: {
  courseId: string;
  item: Item;
  rubric?: Rubric;
  panelSize: number;
  state: ItemProgress;
  link?: ResourceLink;
  expanded: boolean;
  busy: string | null;
  canEdit: boolean;
  onToggleOpen: () => void;
  onStatus: (s: ItemStatus) => void;
  onCheckpoint: (position: number) => void;
}) {
  const complete = state.status === "complete";
  const started = state.status === "in_progress";
  const hasDetail =
    Boolean(item.brief) ||
    Boolean(item.checkpoints?.length) ||
    Boolean(item.locator) ||
    Boolean(item.optional_reason);

  return (
    <li className="rounded-md border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-card">
      <div className="flex items-start gap-3">
        {/* A visitor sees the same state, without a control that would lie
            about being clickable. */}
        <button
          type="button"
          aria-label={
            !canEdit
              ? complete
                ? "Complete"
                : "Not complete"
              : complete
                ? "Mark not started"
                : "Mark complete"
          }
          aria-disabled={!canEdit}
          disabled={!canEdit || busy === `s:${item.id}`}
          onClick={
            canEdit
              ? () => onStatus(complete ? "not_started" : "complete")
              : undefined
          }
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border transition-colors ${
            complete
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border"
          } ${canEdit ? "hover:border-accent disabled:opacity-50" : "cursor-default disabled:opacity-100"}`}
        >
          {complete && (
            <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
              <path
                d="M3.5 8.5l3 3 6-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <button
              type="button"
              onClick={hasDetail ? onToggleOpen : undefined}
              className={`text-left text-[15px] ${
                complete ? "text-muted line-through" : "text-foreground"
              } ${hasDetail ? "hover:text-accent" : "cursor-default"}`}
            >
              <span className="font-mono text-xs text-muted">{item.id}</span>{" "}
              {item.title}
            </button>
            {item.optional && (
              <span className="rounded-full border border-border px-1.5 text-[11px] text-muted">
                optional
              </span>
            )}
            {item.advanced_standing_exempt && (
              <span className="rounded-full border border-border px-1.5 text-[11px] text-muted">
                exemptable
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-muted">
            {item.type} · {minutes(item.est_minutes)} · tier {item.tier}{" "}
            {TIER_LABEL[item.tier]}
            {started && " · in progress"}
          </p>

          {link && (
            <p className="mt-1 text-xs">
              {link.url ? (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  {link.title}
                </a>
              ) : (
                <span className="text-muted">{link.title}</span>
              )}
              {link.channel && (
                <span className="text-muted"> — {link.channel}</span>
              )}
            </p>
          )}

          {expanded && (
            <div className="mt-2 space-y-2 border-l-2 border-border pl-3 text-sm text-muted">
              {item.locator && (
                <p>
                  <span className="font-medium text-foreground">Where: </span>
                  {item.locator}
                </p>
              )}
              {item.optional_reason && (
                <p>
                  <span className="font-medium text-foreground">
                    Optional because:{" "}
                  </span>
                  {item.optional_reason}
                </p>
              )}
              {item.brief && <p>{item.brief}</p>}
              {item.checkpoints?.length ? (
                <ul className="space-y-1">
                  {item.checkpoints.map((c, idx) => {
                    const hit = state.checkpoints.includes(idx);
                    return (
                      <li key={idx}>
                        <button
                          type="button"
                          aria-disabled={!canEdit}
                          disabled={!canEdit || busy === `c:${item.id}:${idx}`}
                          onClick={canEdit ? () => onCheckpoint(idx) : undefined}
                          className={`flex items-start gap-2 text-left ${
                            canEdit
                              ? "disabled:opacity-50"
                              : "cursor-default disabled:opacity-100"
                          }`}
                        >
                          <span
                            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                              hit ? "bg-accent" : "border border-border"
                            }`}
                          />
                          <span className={hit ? "line-through" : undefined}>
                            {c}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {rubric && (
                <RubricPanel item={item} rubric={rubric} panelSize={panelSize} />
              )}
              {rubric && (
                <SubmissionPanel
                  courseId={courseId}
                  item={item}
                  rubric={rubric}
                  canEdit={canEdit}
                />
              )}
              {canEdit && !complete && (
                <button
                  type="button"
                  disabled={busy === `s:${item.id}`}
                  onClick={() => onStatus(started ? "not_started" : "in_progress")}
                  className="rounded border border-border px-2 py-1 text-xs text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  {started ? "Clear in-progress" : "Mark in progress"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
