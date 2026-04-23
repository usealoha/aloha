"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	FileText,
	Sparkles,
	Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
	approvePost,
	backToDraft,
	publishPostNow,
	submitForReview,
} from "@/app/actions/posts";
import {
	canTransition,
	type PostStatus,
} from "@/lib/posts/transitions";
import { CHANNEL_ICONS, CHANNEL_LABELS } from "@/components/channel-chip";
import { previewContent } from "@/lib/post-preview";
import { cn } from "@/lib/utils";

type Row = {
	id: string;
	content: string;
	channelContent?: Record<string, { content?: string } | null> | null;
	platforms: string[];
	status: string;
	scheduledAt: Date | null;
	publishedAt: Date | null;
	createdAt: Date;
};

const COLUMNS: {
	key: PostStatus;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	accent: string;
}[] = [
	{ key: "draft", label: "Draft", icon: FileText, accent: "text-ink/60" },
	{
		key: "in_review",
		label: "In review",
		icon: Clock,
		accent: "text-amber-700",
	},
	{
		key: "approved",
		label: "Approved",
		icon: Sparkles,
		accent: "text-emerald-700",
	},
	{
		key: "scheduled",
		label: "Scheduled",
		icon: Clock,
		accent: "text-primary",
	},
	{
		key: "published",
		label: "Published",
		icon: CheckCircle2,
		accent: "text-ink/70",
	},
	{
		key: "failed",
		label: "Failed",
		icon: AlertCircle,
		accent: "text-destructive",
	},
];

export function PostsBoard({ rows, tz }: { rows: Row[]; tz: string }) {
	const router = useRouter();
	const [optimistic, setOptimistic] = useState<Row[]>(rows);
	const [, startTransition] = useTransition();
	const [draggingId, setDraggingId] = useState<string | null>(null);

	// Keep local state in sync if the server-rendered rows change between
	// renders (e.g., after revalidatePath).
	useMemo(() => setOptimistic(rows), [rows]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);

	const grouped = useMemo(() => {
		const map = new Map<PostStatus, Row[]>();
		for (const col of COLUMNS) map.set(col.key, []);
		for (const row of optimistic) {
			const list = map.get(row.status as PostStatus);
			if (list) list.push(row);
		}
		return map;
	}, [optimistic]);

	const draggingRow = draggingId
		? optimistic.find((r) => r.id === draggingId) ?? null
		: null;

	const applyTransition = async (
		row: Row,
		target: PostStatus,
	): Promise<void> => {
		const from = row.status as PostStatus;
		// Schedule transitions need a time picker — route user to composer
		// instead. Keeping this slice free of inline date pickers.
		if (target === "scheduled") {
			toast.info("Open the post to pick a schedule time.");
			router.push(`/app/composer?post=${row.id}`);
			return;
		}

		let action: () => Promise<unknown>;
		let label: string;
		if (target === "in_review") {
			action = () => submitForReview(row.id);
			label = "Submitted for review.";
		} else if (target === "approved") {
			action = () => approvePost(row.id);
			label = "Approved.";
		} else if (target === "published") {
			action = () => publishPostNow(row.id);
			label = "Publishing…";
		} else if (target === "draft") {
			action = () => backToDraft(row.id);
			label = "Moved back to draft.";
		} else {
			return;
		}

		// Optimistic update — revert on failure.
		setOptimistic((prev) =>
			prev.map((r) => (r.id === row.id ? { ...r, status: target } : r)),
		);
		const toastId = toast.loading("Updating…");
		try {
			await action();
			toast.success(label, { id: toastId });
			router.refresh();
		} catch (err) {
			setOptimistic((prev) =>
				prev.map((r) => (r.id === row.id ? { ...r, status: from } : r)),
			);
			toast.error(err instanceof Error ? err.message : "Couldn't move.", {
				id: toastId,
			});
		}
	};

	const handleDragStart = (event: DragStartEvent) => {
		setDraggingId(String(event.active.id));
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setDraggingId(null);
		const { active, over } = event;
		if (!over) return;
		const row = optimistic.find((r) => r.id === String(active.id));
		if (!row) return;
		const target = String(over.id) as PostStatus;
		if (row.status === target) return;
		if (!canTransition(row.status as PostStatus, target)) {
			toast.error(
				`Can't move from ${row.status.replace("_", " ")} to ${target.replace(
					"_",
					" ",
				)}.`,
			);
			return;
		}
		startTransition(() => {
			void applyTransition(row, target);
		});
	};

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={() => setDraggingId(null)}
		>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
				{COLUMNS.map((col) => (
					<BoardColumn
						key={col.key}
						column={col}
						rows={grouped.get(col.key) ?? []}
						tz={tz}
						draggingRowStatus={
							draggingRow ? (draggingRow.status as PostStatus) : null
						}
					/>
				))}
			</div>

			<DragOverlay>
				{draggingRow ? <CardPreview row={draggingRow} tz={tz} overlay /> : null}
			</DragOverlay>
		</DndContext>
	);
}

function BoardColumn({
	column,
	rows,
	tz,
	draggingRowStatus,
}: {
	column: (typeof COLUMNS)[number];
	rows: Row[];
	tz: string;
	draggingRowStatus: PostStatus | null;
}) {
	const { isOver, setNodeRef } = useDroppable({ id: column.key });
	const Icon = column.icon;
	const isValidDropTarget =
		draggingRowStatus !== null &&
		draggingRowStatus !== column.key &&
		canTransition(draggingRowStatus, column.key);

	return (
		<div
			ref={setNodeRef}
			className={cn(
				"flex flex-col min-h-[360px] rounded-xl border bg-background-elev transition-colors",
				isOver && isValidDropTarget
					? "border-ink bg-peach-50"
					: draggingRowStatus && !isValidDropTarget
						? "border-border opacity-50"
						: "border-border",
			)}
		>
			<div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
				<Icon className={cn("w-3.5 h-3.5", column.accent)} />
				<span className="text-[12px] font-semibold text-ink">
					{column.label}
				</span>
				<span className="text-[11px] text-ink/50 tabular-nums">
					{rows.length}
				</span>
			</div>
			<div className="flex-1 p-2 space-y-2 overflow-y-auto">
				{rows.length === 0 ? (
					<p className="text-[11px] text-ink/40 text-center py-6">
						No posts.
					</p>
				) : (
					rows.map((row) => <DraggableCard key={row.id} row={row} tz={tz} />)
				)}
			</div>
		</div>
	);
}

function DraggableCard({ row, tz }: { row: Row; tz: string }) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: row.id,
	});
	return (
		<div
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			className={cn(
				"cursor-grab active:cursor-grabbing",
				isDragging ? "opacity-30" : "",
			)}
		>
			<CardPreview row={row} tz={tz} />
		</div>
	);
}

function CardPreview({
	row,
	tz,
	overlay = false,
}: {
	row: Row;
	tz: string;
	overlay?: boolean;
}) {
	const text = previewContent(row);
	return (
		<Link
			href={`/app/posts/${row.id}`}
			onClick={(e) => {
				// Suppress navigation when the event is part of an in-progress
				// drag — dnd-kit fires click at the end of a short drag and we
				// don't want to bounce the user into the detail page.
				if (overlay) e.preventDefault();
			}}
			className={cn(
				"block rounded-lg border border-border bg-background px-3 py-2.5 space-y-2",
				overlay
					? "shadow-[0_12px_30px_-12px_rgba(26,22,18,0.4)] rotate-[-1deg]"
					: "hover:border-border-strong",
			)}
		>
			<p className="text-[12.5px] text-ink leading-snug line-clamp-3 whitespace-pre-wrap">
				{text || <span className="text-ink/40">(empty)</span>}
			</p>
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-1">
					{row.platforms.slice(0, 4).map((p) => {
						const Icon = CHANNEL_ICONS[p];
						return Icon ? (
							<Icon
								key={p}
								className="w-3 h-3 text-ink/60"
								aria-label={CHANNEL_LABELS[p] ?? p}
							/>
						) : null;
					})}
					{row.platforms.length > 4 ? (
						<span className="text-[10px] text-ink/50">
							+{row.platforms.length - 4}
						</span>
					) : null}
				</div>
				<span className="text-[10.5px] text-ink/50 tabular-nums">
					{timestampLabel(row, tz)}
				</span>
			</div>
		</Link>
	);
}

function timestampLabel(row: Row, tz: string): string {
	const fmt = (d: Date) =>
		new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			timeZone: tz,
		}).format(d);
	if (row.status === "published" && row.publishedAt) return fmt(row.publishedAt);
	if (row.status === "scheduled" && row.scheduledAt) return fmt(row.scheduledAt);
	return fmt(row.createdAt);
}

void Zap;
