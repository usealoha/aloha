import { Clock, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoredFlowStep } from "@/db/schema";
import type { AutomationKind, ConfigField } from "../_lib/templates";
import { TEMPLATES } from "../_lib/templates";

type IconRenderer = (className: string) => React.ReactNode;

export function FlowDiagram({
  steps,
  kind,
}: {
  steps: StoredFlowStep[];
  kind: AutomationKind;
}) {
  const template = TEMPLATES[kind];
  const fieldsById = new Map<string, ConfigField[] | undefined>();
  const iconsById = new Map<string, IconRenderer>();
  template?.nodes.forEach((n, i) => {
    const id = `${kind}:${i}`;
    fieldsById.set(id, n.fields);
    const Cmp = n.icon;
    iconsById.set(id, (cls) => <Cmp className={cls} />);
  });

  const stepsById = new Map(steps.map((s) => [s.id, s]));
  const childIds = new Set<string>();
  for (const s of steps) {
    for (const id of s.branches?.yes ?? []) childIds.add(id);
    for (const id of s.branches?.no ?? []) childIds.add(id);
  }
  const trunk = steps.filter((s) => !childIds.has(s.id));

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-background-elev">
      <span
        aria-hidden
        className="absolute top-4 right-6 font-display text-[24px] text-ink/10 select-none"
      >
        ✳
      </span>
      <span
        aria-hidden
        className="absolute bottom-6 left-8 font-display text-[18px] text-primary/25 select-none rotate-12"
      >
        +
      </span>

      <div className="relative px-6 py-10 lg:px-10 lg:py-12">
        <div className="max-w-2xl mx-auto">
          {trunk.map((step, i) => (
            <StepBlock
              key={step.id}
              step={step}
              isFirst={i === 0}
              isLast={i === trunk.length - 1}
              fieldsById={fieldsById}
              iconsById={iconsById}
              stepsById={stepsById}
              depth={0}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between text-[12px] text-ink/55 max-w-2xl mx-auto">
          <p className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Runs top to bottom. Conditions split into yes/no lanes.
          </p>
          <p>
            {steps.length} step{steps.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </div>
  );
}

function StepBlock({
  step,
  isFirst,
  isLast,
  fieldsById,
  iconsById,
  stepsById,
  depth,
}: {
  step: StoredFlowStep;
  isFirst: boolean;
  isLast: boolean;
  fieldsById: Map<string, ConfigField[] | undefined>;
  iconsById: Map<string, IconRenderer>;
  stepsById: Map<string, StoredFlowStep>;
  depth: number;
}) {
  const fields = fieldsById.get(step.id);
  const renderIcon = iconsById.get(step.id);

  return (
    <div className="relative">
      {!isFirst ? <Rail /> : null}
      <NodeCard step={step} fields={fields} renderIcon={renderIcon} />

      {step.type === "condition" ? (
        <BranchLanes
          step={step}
          stepsById={stepsById}
          fieldsById={fieldsById}
          iconsById={iconsById}
          depth={depth + 1}
        />
      ) : null}

      {isLast ? null : <Rail />}
    </div>
  );
}

function BranchLanes({
  step,
  stepsById,
  fieldsById,
  iconsById,
  depth,
}: {
  step: StoredFlowStep;
  stepsById: Map<string, StoredFlowStep>;
  fieldsById: Map<string, ConfigField[] | undefined>;
  iconsById: Map<string, IconRenderer>;
  depth: number;
}) {
  const yes = (step.branches?.yes ?? [])
    .map((id) => stepsById.get(id))
    .filter((s): s is StoredFlowStep => !!s);
  const no = (step.branches?.no ?? [])
    .map((id) => stepsById.get(id))
    .filter((s): s is StoredFlowStep => !!s);

  return (
    <div className="relative mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Lane label="If yes" tone="peach" steps={yes} fieldsById={fieldsById} iconsById={iconsById} stepsById={stepsById} depth={depth} />
      <Lane label="If no" tone="muted" steps={no} fieldsById={fieldsById} iconsById={iconsById} stepsById={stepsById} depth={depth} />
    </div>
  );
}

function Lane({
  label,
  tone,
  steps,
  fieldsById,
  iconsById,
  stepsById,
  depth,
}: {
  label: string;
  tone: "peach" | "muted";
  steps: StoredFlowStep[];
  fieldsById: Map<string, ConfigField[] | undefined>;
  iconsById: Map<string, IconRenderer>;
  stepsById: Map<string, StoredFlowStep>;
  depth: number;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "peach"
          ? "bg-peach-100/30 border-peach-300"
          : "bg-muted/40 border-border",
      )}
    >
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
        {label}
      </p>
      {steps.length === 0 ? (
        <p className="mt-3 text-[12px] text-ink/45 italic">Nothing happens.</p>
      ) : (
        <div className="mt-3 space-y-0">
          {steps.map((s, i) => (
            <StepBlock
              key={s.id}
              step={s}
              isFirst={i === 0}
              isLast={i === steps.length - 1}
              fieldsById={fieldsById}
              iconsById={iconsById}
              stepsById={stepsById}
              depth={depth}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NodeCard({
  step,
  fields,
  renderIcon,
}: {
  step: StoredFlowStep;
  fields: ConfigField[] | undefined;
  renderIcon: IconRenderer | undefined;
}) {
  if (step.type === "delay") {
    return <DelayPill step={step} fields={fields} />;
  }

  const isTrigger = step.type === "trigger";
  const isCondition = step.type === "condition";
  const icon = renderIcon
    ? renderIcon("w-4 h-4")
    : <GitBranch className="w-4 h-4" />;
  const summary = summarizeConfig(step.config, fields);

  return (
    <article
      className={cn(
        "relative rounded-2xl border px-5 py-4",
        isTrigger
          ? "bg-peach-100 border-peach-300"
          : isCondition
            ? "bg-background border-border-strong"
            : "bg-background border-border-strong",
      )}
    >
      <p
        className={cn(
          "text-[10.5px] font-semibold uppercase tracking-[0.22em]",
          isTrigger ? "text-ink" : "text-ink/55",
        )}
      >
        {isTrigger
          ? "Trigger"
          : isCondition
            ? "Condition"
            : "Action"}
      </p>
      <div className="mt-2 flex items-start gap-3">
        <span
          className={cn(
            "w-9 h-9 rounded-full grid place-items-center shrink-0 border",
            isTrigger
              ? "bg-ink text-background border-ink"
              : "bg-peach-100 border-border text-ink",
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[17px] leading-[1.2] tracking-[-0.01em] text-ink">
            {step.title}
          </p>
          <p className="mt-1 text-[12.5px] text-ink/60 leading-[1.5]">
            {step.detail}
          </p>
          {summary ? (
            <p className="mt-2 text-[11.5px] text-ink/60 truncate">
              {summary}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function DelayPill({
  step,
  fields,
}: {
  step: StoredFlowStep;
  fields: ConfigField[] | undefined;
}) {
  const summary = summarizeConfig(step.config, fields) ?? step.detail;
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-dashed border-border-strong bg-background text-[12px] text-ink/70">
        <Clock className="w-3.5 h-3.5 text-ink/55" />
        <span>{step.title}</span>
        {summary && summary !== step.detail ? (
          <>
            <span className="text-ink/30">·</span>
            <span className="text-ink/55">{summary}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Rail() {
  return (
    <div className="flex justify-center py-2" aria-hidden>
      <svg width="10" height="28" viewBox="0 0 10 28">
        <path
          d="M5 0 L5 28"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          className="text-ink/25"
          fill="none"
        />
      </svg>
    </div>
  );
}

function summarizeConfig(
  config: Record<string, unknown> | undefined,
  fields: ConfigField[] | undefined,
): string | null {
  if (!config || !fields || fields.length === 0) return null;
  const parts: string[] = [];
  for (const f of fields) {
    const v = config[f.key];
    if (v === undefined || v === null || v === "") continue;
    if (f.type === "schedule") {
      const sched = v as { day: string; hour: number };
      parts.push(`${capitalize(sched.day)} · ${formatHour(sched.hour)}`);
    } else if (f.type === "select") {
      const opt = f.options.find((o) => o.value === v);
      parts.push(opt?.label ?? String(v));
    } else if (f.type === "textarea") {
      parts.push(truncate(String(v), 48));
    } else {
      parts.push(String(v));
    }
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function formatHour(h: number) {
  if (h === 0) return "12 am";
  if (h === 12) return "12 pm";
  if (h < 12) return `${h} am`;
  return `${h - 12} pm`;
}
function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
