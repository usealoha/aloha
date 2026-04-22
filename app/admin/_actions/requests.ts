"use server";

import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { featureAccess } from "@/db/schema";
import { getCurrentAdmin } from "@/lib/admin/session";
import { logAdminAction } from "@/lib/admin/audit";

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) notFound();
  return admin;
}

export async function approveRequest(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const [row] = await db
    .update(featureAccess)
    .set({ grantedAt: new Date(), grantedBy: null, revokedAt: null })
    .where(eq(featureAccess.id, id))
    .returning();

  if (row) {
    await logAdminAction({
      actorId: admin.id,
      action: "feature.grant",
      targetUserId: row.userId,
      metadata: { feature: row.feature },
    });
  }
  redirect("/admin/requests");
}

export async function revokeRequest(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const [row] = await db
    .update(featureAccess)
    .set({ revokedAt: new Date() })
    .where(eq(featureAccess.id, id))
    .returning();

  if (row) {
    await logAdminAction({
      actorId: admin.id,
      action: "feature.revoke",
      targetUserId: row.userId,
      metadata: { feature: row.feature },
    });
  }
  redirect("/admin/requests");
}
