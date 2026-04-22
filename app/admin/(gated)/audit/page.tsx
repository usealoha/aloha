import { db } from "@/db";
import { internalAuditLog, internalUsers, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  AdminPageHeader,
  DataCard,
} from "../../_components/page-header";

export default async function AdminAuditLogPage() {
  const rows = await db
    .select({
      id: internalAuditLog.id,
      action: internalAuditLog.action,
      metadata: internalAuditLog.metadata,
      createdAt: internalAuditLog.createdAt,
      actorEmail: internalUsers.email,
      targetEmail: users.email,
    })
    .from(internalAuditLog)
    .innerJoin(internalUsers, eq(internalAuditLog.actorId, internalUsers.id))
    .leftJoin(users, eq(internalAuditLog.targetUserId, users.id))
    .orderBy(desc(internalAuditLog.createdAt))
    .limit(200);

  return (
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow="Paper trail"
        title="Audit log"
        subtitle="Every admin action, in order."
      />

      <DataCard>
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-ink/55 border-b border-border">
            <tr>
              <Th>When</Th>
              <Th>Actor</Th>
              <Th>Action</Th>
              <Th>Target</Th>
              <Th>Metadata</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/40"
              >
                <Td className="text-ink/65 whitespace-nowrap tabular-nums">
                  {r.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                </Td>
                <Td>{r.actorEmail}</Td>
                <Td>
                  <span className="inline-flex items-center h-6 px-2 rounded-full bg-peach-100/70 text-[11px] text-ink">
                    {r.action}
                  </span>
                </Td>
                <Td>{r.targetEmail ?? "—"}</Td>
                <Td>
                  {Object.keys(r.metadata).length ? (
                    <code className="text-[11.5px] text-ink/70 break-all">
                      {JSON.stringify(r.metadata)}
                    </code>
                  ) : (
                    <span className="text-ink/45">—</span>
                  )}
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-ink/55 text-[13px]"
                >
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DataCard>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 font-medium">{children}</th>;
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 text-ink/80 align-top ${className}`}>
      {children}
    </td>
  );
}
