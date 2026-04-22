import { db } from "@/db";
import { internalAuditLog } from "@/db/schema";

export async function logAdminAction(params: {
  actorId: string;
  action: string;
  targetUserId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(internalAuditLog).values({
    actorId: params.actorId,
    action: params.action,
    targetUserId: params.targetUserId ?? null,
    metadata: params.metadata ?? {},
  });
}
