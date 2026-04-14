"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { automations } from "@/db/schema";
import { TEMPLATES, type AutomationKind } from "./_lib/templates";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createAutomation(formData: FormData) {
  const userId = await requireUserId();
  const kind = String(formData.get("kind") ?? "") as AutomationKind;

  const template = TEMPLATES[kind];
  if (!template) throw new Error("Unknown automation template.");

  const [row] = await db
    .insert(automations)
    .values({
      userId,
      kind,
      name: template.name,
      status: "active",
    })
    .returning({ id: automations.id });

  revalidatePath("/app/automations");
  redirect(`/app/automations?id=${row.id}`);
}

export async function toggleAutomation(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const [current] = await db
    .select({ status: automations.status })
    .from(automations)
    .where(and(eq(automations.id, id), eq(automations.userId, userId)))
    .limit(1);
  if (!current) return;

  const next = current.status === "active" ? "paused" : "active";

  await db
    .update(automations)
    .set({ status: next, updatedAt: new Date() })
    .where(and(eq(automations.id, id), eq(automations.userId, userId)));

  revalidatePath("/app/automations");
}

export async function deleteAutomation(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db
    .delete(automations)
    .where(and(eq(automations.id, id), eq(automations.userId, userId)));

  revalidatePath("/app/automations");
  redirect("/app/automations");
}
