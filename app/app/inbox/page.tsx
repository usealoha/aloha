import { FilterTabs } from "@/components/ui/filter-tabs";
import { db } from "@/db";
import { inboxMessages } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getCurrentContext } from "@/lib/current-context";
import { and, desc, eq, sql } from "drizzle-orm";
import { MarkAllReadButton, RefreshButton } from "./_components/inbox-actions";
import { InboxEmpty } from "./_components/inbox-empty";
import { InboxList } from "./_components/inbox-list";
import { InboxThread } from "./_components/inbox-thread";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const FILTERS = ["all", "unread", "mentions", "dms"] as const;
type Filter = (typeof FILTERS)[number];

const first = (v: string | string[] | undefined) =>
	Array.isArray(v) ? v[0] : v;

export default async function InboxPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const user = (await getCurrentUser())!;

	const ctx = (await getCurrentContext())!;

	const { workspace } = ctx;
	const tz = user.timezone ?? "UTC";

	const params = await searchParams;
	const filter: Filter = FILTERS.includes(first(params.filter) as Filter)
		? (first(params.filter) as Filter)
		: "all";
	const selectedId = first(params.selected) ?? null;

	// Opening a DM convo marks every message in that thread as read.
	// Mentions stay per-message. We mutate before the list query runs so
	// the rendered rows reflect the new state without a second round-trip.
	if (selectedId) {
		const [preview] = await db
			.select({
				reason: inboxMessages.reason,
				threadId: inboxMessages.threadId,
			})
			.from(inboxMessages)
			.where(
				and(
					eq(inboxMessages.id, selectedId),
					eq(inboxMessages.workspaceId, workspace.id),
				),
			)
			.limit(1);

		if (preview?.reason === "dm" && preview.threadId) {
			await db
				.update(inboxMessages)
				.set({ isRead: true, updatedAt: new Date() })
				.where(
					and(
						eq(inboxMessages.workspaceId, workspace.id),
						eq(inboxMessages.threadId, preview.threadId),
						eq(inboxMessages.reason, "dm"),
						eq(inboxMessages.isRead, false),
					),
				);
		}
	}

	const where = [eq(inboxMessages.workspaceId, workspace.id)];
	if (filter === "unread") where.push(eq(inboxMessages.isRead, false));
	if (filter === "mentions") where.push(eq(inboxMessages.reason, "mention"));
	if (filter === "dms") where.push(eq(inboxMessages.reason, "dm"));

	// Messages + counts are independent — fire concurrently. Counts are
	// computed in SQL rather than scanning the whole inbox in Node.
	const [messages, countsRows] = await Promise.all([
		db
			.select()
			.from(inboxMessages)
			.where(and(...where))
			.orderBy(desc(inboxMessages.platformCreatedAt))
			.limit(200),
		db
			.select({
				all: sql<number>`count(*)`,
				unread: sql<number>`count(*) filter (where ${inboxMessages.isRead} = false)`,
				mentions: sql<number>`count(*) filter (where ${inboxMessages.reason} = 'mention')`,
				dms: sql<number>`count(*) filter (where ${inboxMessages.reason} = 'dm')`,
			})
			.from(inboxMessages)
			.where(eq(inboxMessages.workspaceId, workspace.id)),
	]);
	const countRow = countsRows[0];
	const counts: Record<Filter, number> = {
		all: Number(countRow?.all ?? 0),
		unread: Number(countRow?.unread ?? 0),
		mentions: Number(countRow?.mentions ?? 0),
		dms: Number(countRow?.dms ?? 0),
	};

	let threadMessages: typeof messages = [];
	if (selectedId) {
		const selected = messages.find((m) => m.id === selectedId);
		if (selected?.threadId) {
			threadMessages = await db
				.select()
				.from(inboxMessages)
				.where(
					and(
						eq(inboxMessages.workspaceId, workspace.id),
						eq(inboxMessages.threadId, selected.threadId),
					),
				)
				.orderBy(inboxMessages.platformCreatedAt)
				.limit(100);
		} else if (selected) {
			threadMessages = [selected];
		}
	}

	return (
		<div className="space-y-10">
			<header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Messages
					</p>
					<h1 className="mt-3 font-display text-[44px] lg:text-[56px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
						Inbox<span className="text-primary font-light">.</span>
					</h1>
					<p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
						Mentions and DMs from your connected channels. Replies on your
						posts live on each post&apos;s page.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<MarkAllReadButton />
					<RefreshButton />
				</div>
			</header>

			<FilterTabs
				activeKey={filter}
				items={FILTERS.map((f) => ({
					key: f,
					label: f === "dms" ? "DMs" : f.charAt(0).toUpperCase() + f.slice(1),
					href: f === "all" ? "/app/inbox" : `/app/inbox?filter=${f}`,
					count: counts[f],
				}))}
			/>

			{messages.length === 0 ? (
				<InboxEmpty />
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0 rounded-2xl border border-border bg-background-elev overflow-hidden min-h-[500px]">
					{/* Message list */}
					<div className="overflow-y-auto border-r border-border max-h-[700px]">
						<InboxList messages={messages} selectedId={selectedId} tz={tz} />
					</div>

					{/* Thread panel */}
					<div className="hidden lg:flex flex-col">
						{selectedId && threadMessages.length > 0 ? (
							<InboxThread
								messages={threadMessages}
								selectedId={selectedId}
								tz={tz}
							/>
						) : (
							<div className="flex-1 grid place-items-center text-[14px] text-ink/40">
								Select a message to view the conversation
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
