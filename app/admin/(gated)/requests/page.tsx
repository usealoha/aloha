import { db } from "@/db";
import { featureAccess, users } from "@/db/schema";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import {
  AdminPageHeader,
  DataCard,
} from "../../_components/page-header";
import { approveRequest, revokeRequest } from "../../_actions/requests";

export default async function AdminRequestsPage() {
  const rows = await db
    .select({
      id: featureAccess.id,
      feature: featureAccess.feature,
      requestedAt: featureAccess.requestedAt,
      grantedAt: featureAccess.grantedAt,
      revokedAt: featureAccess.revokedAt,
      email: users.email,
      userId: users.id,
    })
    .from(featureAccess)
    .innerJoin(users, eq(featureAccess.userId, users.id))
    .where(
      and(isNotNull(featureAccess.requestedAt), isNull(featureAccess.grantedAt)),
    )
    .orderBy(desc(featureAccess.requestedAt))
    .limit(200);

  return (
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow="Queue"
        title="Access requests"
        subtitle="Users who clicked “request access” on a gated feature."
      />

      <DataCard>
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-ink/55 border-b border-border">
            <tr>
              <Th>Email</Th>
              <Th>Feature</Th>
              <Th>Requested</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/40"
              >
                <Td>
                  <span className="text-ink font-medium">{r.email}</span>
                </Td>
                <Td>
                  <span className="inline-flex items-center h-6 px-2 rounded-full bg-peach-100/70 text-[11px] text-ink">
                    {r.feature}
                  </span>
                </Td>
                <Td className="text-ink/65">
                  {r.requestedAt?.toISOString().slice(0, 10)}
                </Td>
                <Td className="text-right">
                  <div className="inline-flex gap-3">
                    <form action={approveRequest}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="h-8 px-3 rounded-full bg-ink text-background text-[12px] font-medium hover:bg-primary transition-colors">
                        Approve
                      </button>
                    </form>
                    <form action={revokeRequest}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="h-8 px-3 rounded-full border border-border-strong text-[12px] text-ink hover:border-ink transition-colors">
                        Dismiss
                      </button>
                    </form>
                  </div>
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-ink/55 text-[13px]"
                >
                  No pending requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DataCard>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`text-left px-4 py-3 font-medium ${className}`}>
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-ink/80 ${className}`}>{children}</td>;
}
