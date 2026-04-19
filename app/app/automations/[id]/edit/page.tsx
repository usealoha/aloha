import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { automations } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { Builder, type BuilderStepValues } from "../../_components/builder";
import {
  TEMPLATES,
  type AutomationKind,
} from "../../_lib/templates";
import { resolveSteps } from "../../_lib/steps";
import { updateAutomationFromBuilder } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditAutomationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const [row] = await db
    .select()
    .from(automations)
    .where(and(eq(automations.id, id), eq(automations.userId, user.id)))
    .limit(1);
  if (!row) notFound();

  const kind = row.kind as AutomationKind;
  const template = TEMPLATES[kind];
  if (!template) notFound();

  const storedSteps = resolveSteps(row);
  const initialStepValues: BuilderStepValues = {};
  template.nodes.forEach((n, i) => {
    const stepId = `${kind}:${i}`;
    const stored = storedSteps[i]?.config ?? {};
    initialStepValues[stepId] = stored;
  });

  return (
    <Builder
      mode="edit"
      kind={kind}
      templateName={template.name}
      templateSummary={template.summary}
      nodes={template.nodes}
      initialName={row.name}
      initialStepValues={initialStepValues}
      action={updateAutomationFromBuilder}
      automationId={row.id}
    />
  );
}
