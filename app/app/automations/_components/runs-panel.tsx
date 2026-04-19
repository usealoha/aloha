"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, CircleDashed, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoredFlowStep, StoredStepResult } from "@/db/schema";

export type RunView = {
  id: string;
  status: "running" | "waiting" | "success" | "failed" | "skipped";
  startedAt: Date;
  finishedAt: Date | null;
  stepResults: StoredStepResult[];
  error: string | null;
  trigger: Record<string, unknown> | null;
  resumeAt: Date | null;
};

export function RunsPanel({
  runs,
  steps,
}: {
  runs: RunView[];
  steps: StoredFlowStep[];
}) {
  const stepById = new Map(steps.map((s) => [s.id, s]));

  return (
    <section className="rounded-3xl border border-border bg-background-elev">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Run history
          </p>
          <h3 className="mt-1 font-display text-[18px] leading-[1.2] tracking-[-0.01em] text-ink">
            Last {runs.length || "—"} runs
          </h3>
        </div>
        <p className="text-[11.5px] text-ink/55">
          Click a row for per-step detail
        </p>
      </header>

      {runs.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <CircleDashed className="w-5 h-5 mx-auto text-ink/30" />
          <p className="mt-3 text-[13px] text-ink/60">
            No runs yet. When this automation fires, the history will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {runs.map((run) => (
            <RunRow key={run.id} run={run} stepById={stepById} />
          ))}
        </ul>
      )}
    </section>
  );
}

function RunRow({
  run,
  stepById,
}: {
  run: RunView;
  stepById: Map<string, StoredFlowStep>;
}) {
  const [open, setOpen] = useState(false);
  const duration =
    run.finishedAt && run.startedAt
      ? run.finishedAt.getTime() - run.startedAt.getTime()
      : null;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-6 py-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        <RunStatusIcon status={run.status} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-ink">
            {relativeTime(run.startedAt)}
            <span className="text-ink/45"> · {formatDateTime(run.startedAt)}</span>
          </p>
          {run.status === "waiting" && run.resumeAt ? (
            <p className="mt-0.5 text-[11.5px] text-ink/55">
              Resumes {relativeFuture(run.resumeAt)} · {formatDateTime(run.resumeAt)}
            </p>
          ) : run.error ? (
            <p className="mt-0.5 text-[11.5px] text-primary-deep truncate">
              {run.error}
            </p>
          ) : null}
        </div>
        <div className="text-[11.5px] text-ink/55 tabular-nums shrink-0">
          {run.status === "waiting"
            ? "waiting"
            : duration !== null
              ? formatDuration(duration)
              : "—"}
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-ink/40 transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="px-6 pb-4 pt-1">
          <ol className="space-y-2">
            {run.stepResults.map((r) => {
              const step = stepById.get(r.stepId);
              const start = new Date(r.startedAt);
              const end = new Date(r.finishedAt);
              return (
                <li
                  key={r.stepId}
                  className="rounded-xl border border-border bg-background px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <RunStatusIcon status={r.status} size="sm" />
                    <p className="text-[12.5px] text-ink font-medium flex-1 min-w-0 truncate">
                      {step?.title ?? r.stepId}
                    </p>
                    <span className="text-[11px] text-ink/50 tabular-nums shrink-0">
                      {formatDuration(end.getTime() - start.getTime())}
                    </span>
                  </div>
                  {r.error ? (
                    <p className="mt-2 text-[11.5px] text-primary-deep">
                      {r.error}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
          {run.trigger ? (
            <details className="mt-3">
              <summary className="text-[11.5px] text-ink/55 cursor-pointer hover:text-ink">
                Trigger payload
              </summary>
              <pre className="mt-2 text-[11px] text-ink/70 bg-background rounded-xl border border-border p-3 overflow-x-auto">
                {JSON.stringify(run.trigger, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function RunStatusIcon({
  status,
  size = "md",
}: {
  status: "running" | "waiting" | "success" | "failed" | "skipped";
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  if (status === "success")
    return <CheckCircle2 className={cn(cls, "text-ink shrink-0")} />;
  if (status === "failed")
    return <AlertCircle className={cn(cls, "text-primary-deep shrink-0")} />;
  if (status === "running" || status === "waiting")
    return <Clock className={cn(cls, "text-ink/50 shrink-0")} />;
  return <CircleDashed className={cn(cls, "text-ink/40 shrink-0")} />;
}

function relativeTime(d: Date): string {
  const delta = Date.now() - d.getTime();
  const m = Math.round(delta / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function relativeFuture(d: Date): string {
  const delta = d.getTime() - Date.now();
  if (delta <= 0) return "now";
  const m = Math.round(delta / 60_000);
  if (m < 1) return "in under a minute";
  if (m < 60) return `in ${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `in ${h}h`;
  const days = Math.round(h / 24);
  return `in ${days}d`;
}

function formatDateTime(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s - m * 60);
  return `${m}m ${rem}s`;
}
