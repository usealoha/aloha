// Prompt template loader. Templates live in `prompt_templates` — pinned by
// (name, version). Feature code asks for a specific version; rolling a new
// version is a DB upsert behind a deploy, not a config change.
//
// `ensureTemplate` is idempotent: first call that references a (name, version)
// inserts it. Safe to call at module import time so a fresh environment has
// the templates it needs without a separate seed step.

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { promptTemplates } from "@/db/schema";

export type PromptTemplate = {
  name: string;
  version: number;
  systemPrompt: string;
};

export async function ensureTemplate(template: PromptTemplate): Promise<void> {
  await db
    .insert(promptTemplates)
    .values({
      name: template.name,
      version: template.version,
      systemPrompt: template.systemPrompt,
    })
    .onConflictDoNothing({
      target: [promptTemplates.name, promptTemplates.version],
    });
}

export async function loadTemplate(
  name: string,
  version: number,
): Promise<PromptTemplate> {
  const row = await db.query.promptTemplates.findFirst({
    where: and(
      eq(promptTemplates.name, name),
      eq(promptTemplates.version, version),
    ),
  });
  if (!row) {
    throw new Error(`Prompt template ${name}@v${version} not found`);
  }
  return {
    name: row.name,
    version: row.version,
    systemPrompt: row.systemPrompt,
  };
}
