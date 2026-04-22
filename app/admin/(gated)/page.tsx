import { db } from "@/db";
import { users, posts, generations, featureAccess } from "@/db/schema";
import { sql, and, isNull, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { MailCheck, Users as UsersIcon } from "lucide-react";
import {
  AdminPageHeader,
  DataCard,
  SectionHeader,
  StatCard,
} from "../_components/page-header";

async function getStats() {
  const [[userCount], [postCount], [genAgg], [pendingReq]] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(users),
    db.select({ c: sql<number>`count(*)::int` }).from(posts),
    db
      .select({
        c: sql<number>`count(*)::int`,
        cost: sql<number>`coalesce(sum(${generations.costMicros}), 0)::bigint`,
      })
      .from(generations),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(featureAccess)
      .where(
        and(isNotNull(featureAccess.requestedAt), isNull(featureAccess.grantedAt)),
      ),
  ]);
  return {
    users: userCount.c,
    posts: postCount.c,
    generations: genAgg.c,
    aiCostUsd: Number(genAgg.cost) / 1_000_000,
    pendingRequests: pendingReq.c,
  };
}

export default async function AdminOverviewPage() {
  const stats = await getStats();
  return (
    <div className="space-y-14">
      <AdminPageHeader
        eyebrow="Operations"
        title="Overview"
        subtitle="Everything worth watching across Aloha — users, posts, spend, and pending approvals."
        actions={
          <>
            <Link
              href="/admin/requests"
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full border border-border-strong text-[14px] font-medium text-ink hover:border-ink transition-colors"
            >
              <MailCheck className="w-4 h-4" />
              Requests
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
            >
              <UsersIcon className="w-4 h-4" />
              Browse users
            </Link>
          </>
        }
      />

      <section>
        <SectionHeader eyebrow="At a glance" title="Platform numbers" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Users"
            value={stats.users.toLocaleString()}
            hint="total signups"
          />
          <StatCard
            label="Posts"
            value={stats.posts.toLocaleString()}
            hint="all statuses"
          />
          <StatCard
            label="AI calls"
            value={stats.generations.toLocaleString()}
            hint="lifetime generations"
          />
          <StatCard
            label="AI spend"
            value={`$${stats.aiCostUsd.toFixed(2)}`}
            hint="USD, lifetime"
          />
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="Queue"
          title="Needs your attention"
          actionLabel="Open requests →"
          actionHref="/admin/requests"
        />
        <DataCard>
          <div className="p-6 flex items-baseline gap-3">
            <span className="font-display text-[40px] leading-none tracking-[-0.02em] text-ink">
              {stats.pendingRequests.toLocaleString()}
            </span>
            <span className="text-[13px] text-ink/60">
              pending access request
              {stats.pendingRequests === 1 ? "" : "s"}
            </span>
          </div>
        </DataCard>
      </section>
    </div>
  );
}
