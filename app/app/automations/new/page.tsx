import Link from "next/link";
import { Builder, type BuilderStepValues } from "../_components/builder";
import {
  TEMPLATES,
  TEMPLATE_LIST,
  type AutomationKind,
} from "../_lib/templates";
import { defaultConfig } from "../_lib/steps";
import { createAutomationFromBuilder } from "../actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function NewAutomationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const kindParam = first(params.kind) as AutomationKind | undefined;

  if (!kindParam || !TEMPLATES[kindParam]) {
    return <TemplatePicker />;
  }

  const template = TEMPLATES[kindParam];
  const initialStepValues: BuilderStepValues = {};
  template.nodes.forEach((n, i) => {
    initialStepValues[`${kindParam}:${i}`] = defaultConfig(n.fields);
  });

  return (
    <Builder
      mode="create"
      kind={kindParam}
      templateName={template.name}
      templateSummary={template.summary}
      nodes={template.nodes}
      initialName={template.name}
      initialStepValues={initialStepValues}
      action={createAutomationFromBuilder}
    />
  );
}

function TemplatePicker() {
  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/app/automations"
          className="text-[11.5px] text-ink/55 hover:text-ink transition-colors"
        >
          ← Back to automations
        </Link>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Start from a template
        </p>
        <h1 className="mt-2 font-display text-[36px] lg:text-[44px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
          Pick a routine to shape
        </h1>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {TEMPLATE_LIST.map((t) => (
          <Link
            key={t.kind}
            href={`/app/automations/new?kind=${t.kind}`}
            className="group rounded-2xl border border-border bg-background-elev p-5 flex flex-col"
          >
            <span className="w-10 h-10 rounded-full bg-peach-100 border border-border grid place-items-center text-ink">
              <t.icon className="w-4 h-4" />
            </span>
            <h3 className="mt-4 font-display text-[20px] leading-[1.2] tracking-[-0.01em] text-ink">
              {t.name}
            </h3>
            <p className="mt-2 text-[13px] text-ink/65 leading-[1.5] flex-1">
              {t.summary}
            </p>
            <p className="mt-4 text-[12px] text-ink/55 group-hover:text-ink transition-colors">
              Configure →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
