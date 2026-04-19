"use server";

import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function unsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const subscriberId = verifyUnsubscribeToken(token);
  if (!subscriberId) return;

  await db
    .update(subscribers)
    .set({ unsubscribedAt: new Date(), updatedAt: new Date() })
    .where(eq(subscribers.id, subscriberId));

  revalidatePath(`/u/unsub/${token}`);
}
