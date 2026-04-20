"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Calendar, Loader2, Save, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TEMPLATES,
  type AutomationKind,
  type ConfigField,
  type FlowNode,
} from "../_lib/templates";

export type BuilderStepValues = Record<string, Record<string, unknown>>;

const DAY_OPTIONS = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
  { value: "sun", label: "Sunday" },
];

export function Builder({
  mode,
  kind,
  initialName,
  initialStepValues,
  action,
  automationId,
}: {
  mode: "create" | "edit";
  kind: AutomationKind;
  initialName: string;
  initialStepValues: BuilderStepValues;
  action: (formData: FormData) => void | Promise<void>;
  automationId?: string;
}) {
  const template = TEMPLATES[kind];
  const templateName = template.name;
  const templateSummary = template.summary;
  const nodes = template.nodes;
  const [name, setName] = useState(initialName);
  const [stepValues, setStepValues] =
    useState<BuilderStepValues>(initialStepValues);

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="kind" value={kind} />
      {automationId ? (
        <input type="hidden" name="id" value={automationId} />
      ) : null}
      <input type="hidden" name="payload" value={JSON.stringify(stepValues)} />

      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <Link
            href="/app/automations"
            className="inline-flex items-center gap-1.5 text-[11.5px] text-ink/55 hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to automations
          </Link>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            {mode === "edit" ? "Editing" : "New routine"} · {templateName}
          </p>
          <h1 className="mt-2 font-display text-[36px] lg:text-[44px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            {mode === "edit" ? "Tune the details" : "Shape this routine"}
          </h1>
          <p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
            {templateSummary}
          </p>
        </div>
      </header>

      <section className="rounded-3xl border border-border bg-background-elev p-6 lg:p-7">
        <label
          htmlFor="name"
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full bg-transparent border-0 border-b border-border-strong focus:border-ink outline-none pb-2 font-display text-[24px] tracking-[-0.02em] text-ink placeholder:text-ink/30"
          placeholder="e.g. Welcome new subscribers"
        />
      </section>

      <ol className="space-y-4">
        {nodes.map((node, i) => {
          const stepId = `${kind}:${i}`;
          const values = stepValues[stepId] ?? {};
          return (
            <li key={stepId}>
              <StepCard
                stepId={stepId}
                index={i}
                node={node}
                values={values}
                onChange={(k, v) =>
                  setStepValues((prev) => ({
                    ...prev,
                    [stepId]: { ...prev[stepId], [k]: v },
                  }))
                }
              />
            </li>
          );
        })}
      </ol>

      <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <p className="text-[12px] text-ink/55">
          {mode === "edit"
            ? "Changes apply to the next run."
            : "Starts paused. Activate from the detail page when ready."}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={
              mode === "edit" && automationId
                ? `/app/automations?id=${automationId}`
                : "/app/automations"
            }
            className="inline-flex items-center h-10 px-4 rounded-full text-[13px] text-ink/60 hover:text-ink transition-colors"
          >
            Cancel
          </Link>
          <SubmitButton mode={mode} />
        </div>
      </footer>
    </form>
  );
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-60 disabled:hover:bg-ink transition-colors"
    >
      {pending ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {mode === "edit" ? "Saving…" : "Creating…"}
        </>
      ) : mode === "edit" ? (
        <>
          <Save className="w-3.5 h-3.5" />
          Save changes
        </>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5" />
          Create routine
        </>
      )}
    </button>
  );
}

function StepCard({
  stepId,
  index,
  node,
  values,
  onChange,
}: {
  stepId: string;
  index: number;
  node: FlowNode;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const Icon = node.icon;
  const isTrigger = node.type === "trigger";
  const fields = node.fields ?? [];

  return (
    <article
      className={cn(
        "rounded-2xl border p-6",
        isTrigger
          ? "bg-peach-100/40 border-peach-300"
          : "bg-background-elev border-border",
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "w-10 h-10 rounded-full grid place-items-center shrink-0 border",
            isTrigger
              ? "bg-ink text-background border-ink"
              : "bg-peach-100 border-border text-ink",
          )}
        >
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Step {index + 1} · {isTrigger ? "Trigger" : "Action"}
          </p>
          <p className="mt-1 font-display text-[20px] leading-[1.2] tracking-[-0.01em] text-ink">
            {node.title}
          </p>
          <p className="mt-1 text-[12.5px] text-ink/60">{node.detail}</p>
        </div>
      </div>

      {fields.length > 0 ? (
        <div className="mt-5 pl-14 space-y-4">
          {fields.map((field) => (
            <FieldRenderer
              key={field.key}
              stepId={stepId}
              field={field}
              value={values[field.key]}
              onChange={(v) => onChange(field.key, v)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 pl-14 text-[12px] text-ink/45 italic">
          Nothing to configure for this step.
        </p>
      )}
    </article>
  );
}

function FieldRenderer({
  stepId,
  field,
  value,
  onChange,
}: {
  stepId: string;
  field: ConfigField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const id = `${stepId}-${field.key}`;
  const labelCls =
    "text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55";
  const helpCls = "mt-1 text-[11.5px] text-ink/50";
  const inputCls =
    "w-full rounded-xl border border-border-strong bg-background px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-ink transition-colors";

  if (field.type === "text") {
    return (
      <div>
        <label htmlFor={id} className={labelCls}>
          {field.label}
          {field.required ? <span className="text-primary-deep"> *</span> : null}
        </label>
        <input
          id={id}
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          className={cn(inputCls, "mt-1.5")}
        />
        {field.help ? <p className={helpCls}>{field.help}</p> : null}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <label htmlFor={id} className={labelCls}>
          {field.label}
          {field.required ? <span className="text-primary-deep"> *</span> : null}
        </label>
        <textarea
          id={id}
          rows={4}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          className={cn(inputCls, "mt-1.5 resize-y leading-[1.55]")}
        />
        {field.help ? <p className={helpCls}>{field.help}</p> : null}
      </div>
    );
  }

  if (field.type === "select") {
    const current = (value as string) ?? field.default ?? field.options[0]?.value;
    return (
      <div>
        <label htmlFor={id} className={labelCls}>
          {field.label}
        </label>
        <select
          id={id}
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputCls, "mt-1.5 appearance-none cursor-pointer")}
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {field.help ? <p className={helpCls}>{field.help}</p> : null}
      </div>
    );
  }

  // schedule
  const current =
    (value as { day: string; hour: number } | undefined) ??
    field.default ?? { day: "mon", hour: 9 };
  return (
    <div>
      <p className={labelCls}>{field.label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="w-9 h-9 rounded-full bg-peach-100 border border-border grid place-items-center shrink-0 text-ink">
          <Calendar className="w-4 h-4" />
        </span>
        <select
          value={current.day}
          onChange={(e) => onChange({ ...current, day: e.target.value })}
          className={cn(inputCls, "flex-1 appearance-none cursor-pointer")}
        >
          {DAY_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <select
          value={String(current.hour)}
          onChange={(e) =>
            onChange({ ...current, hour: Number(e.target.value) })
          }
          className={cn(inputCls, "w-28 appearance-none cursor-pointer")}
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {formatHour(h)}
            </option>
          ))}
        </select>
      </div>
      {field.help ? <p className={helpCls}>{field.help}</p> : null}
    </div>
  );
}

function formatHour(h: number): string {
  if (h === 0) return "12 am";
  if (h === 12) return "12 pm";
  if (h < 12) return `${h} am`;
  return `${h - 12} pm`;
}
