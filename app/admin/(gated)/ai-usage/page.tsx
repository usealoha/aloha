import { db } from "@/db";
import { generations, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import {
  AdminPageHeader,
  DataCard,
  SectionHeader,
} from "../../_components/page-header";

export default async function AdminAiUsagePage() {
  const perUser = await db
    .select({
      email: users.email,
      userId: users.id,
      count: sql<number>`count(*)::int`,
      costMicros: sql<number>`coalesce(sum(${generations.costMicros}), 0)::bigint`,
      tokensIn: sql<number>`coalesce(sum(${generations.tokensIn}), 0)::bigint`,
      tokensOut: sql<number>`coalesce(sum(${generations.tokensOut}), 0)::bigint`,
    })
    .from(generations)
    .innerJoin(users, eq(generations.userId, users.id))
    .groupBy(users.id, users.email)
    .orderBy(desc(sql`coalesce(sum(${generations.costMicros}), 0)`))
    .limit(100);

  const perFeature = await db
    .select({
      feature: generations.feature,
      count: sql<number>`count(*)::int`,
      costMicros: sql<number>`coalesce(sum(${generations.costMicros}), 0)::bigint`,
    })
    .from(generations)
    .groupBy(generations.feature)
    .orderBy(desc(sql`coalesce(sum(${generations.costMicros}), 0)`));

  const maxFeatureCost = Math.max(
    1,
    ...perFeature.map((r) => Number(r.costMicros)),
  );

  return (
    <div className="space-y-14">
      <AdminPageHeader
        eyebrow="Intelligence"
        title="AI usage"
        subtitle="Generations, tokens, and spend across every Aloha feature."
      />

      <section>
        <SectionHeader eyebrow="Spend" title="By feature" />
        <DataCard>
          <ul className="divide-y divide-border">
            {perFeature.map((r) => {
              const usd = Number(r.costMicros) / 1_000_000;
              const share = Math.round(
                (Number(r.costMicros) / maxFeatureCost) * 100,
              );
              return (
                <li key={r.feature} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-4 text-[13.5px]">
                    <span className="text-ink font-medium">{r.feature}</span>
                    <span className="text-ink/60 tabular-nums">
                      {r.count.toLocaleString()} calls · $
                      {usd.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full bg-ink/70 rounded-full transition-all"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </li>
              );
            })}
            {perFeature.length === 0 && (
              <li className="px-6 py-10 text-center text-ink/55 text-[13px]">
                No generations yet.
              </li>
            )}
          </ul>
        </DataCard>
      </section>

      <section>
        <SectionHeader eyebrow="Leaderboard" title="Top spenders" />
        <DataCard>
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-ink/55 border-b border-border">
              <tr>
                <Th>Email</Th>
                <Th className="text-right">Calls</Th>
                <Th className="text-right">Tokens in</Th>
                <Th className="text-right">Tokens out</Th>
                <Th className="text-right">Cost (USD)</Th>
              </tr>
            </thead>
            <tbody>
              {perUser.map((r) => (
                <tr
                  key={r.userId}
                  className="border-b border-border last:border-b-0 hover:bg-muted/40"
                >
                  <Td>
                    <span className="text-ink font-medium">{r.email}</span>
                  </Td>
                  <Td className="text-right tabular-nums">
                    {r.count.toLocaleString()}
                  </Td>
                  <Td className="text-right tabular-nums text-ink/65">
                    {Number(r.tokensIn).toLocaleString()}
                  </Td>
                  <Td className="text-right tabular-nums text-ink/65">
                    {Number(r.tokensOut).toLocaleString()}
                  </Td>
                  <Td className="text-right tabular-nums">
                    ${(Number(r.costMicros) / 1_000_000).toFixed(2)}
                  </Td>
                </tr>
              ))}
              {perUser.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-ink/55 text-[13px]"
                  >
                    No spend to report.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DataCard>
      </section>
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
