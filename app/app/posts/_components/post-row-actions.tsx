"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deletePost, permanentDeletePost } from "@/app/actions/posts";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { CHANNEL_LABELS } from "@/components/channel-chip";
import { cn } from "@/lib/utils";

type Props = {
	postId: string;
	// Drives which delete options appear. Only `published` shows the
	// "delete from platforms" option — everything else is local-only.
	// `deleted` posts show "permanently delete" option.
	status:
		| "draft"
		| "in_review"
		| "approved"
		| "scheduled"
		| "published"
		| "failed"
		| "deleted";
	platforms: string[];
};

type ConfirmState =
	| { type: "delete"; mode: "local" | "remote" }
	| { type: "permanent" }
	| null;

export function PostRowActions({ postId, status, platforms }: Props) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [confirmState, setConfirmState] = useState<ConfirmState>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const canDeleteFromPlatform = status === "published";
	const isDeleted = status === "deleted";

	const onSoftDelete = (mode: "local" | "remote") => {
		const toastId = toast.loading(
			mode === "remote"
				? `Deleting from ${platformsSummary(platforms)}…`
				: "Moving to deleted…",
		);
		startTransition(async () => {
			try {
				const result = await deletePost(postId, mode);

				if (mode === "local") {
					toast.success("Post moved to deleted. It will be permanently removed after 30 days.", { id: toastId });
					setConfirmState(null);
					return;
				}

				const okChannels = result.results
					.filter((r) => r.ok)
					.map((r) => CHANNEL_LABELS[r.platform] ?? r.platform);
				const failedChannels = result.results.filter((r) => !r.ok);

				if (result.success) {
					toast.success(
						okChannels.length > 0
							? `Deleted from ${okChannels.join(", ")}.`
							: "Post deleted.",
						{ id: toastId },
					);
				} else if (okChannels.length > 0) {
					toast.warning(
						`Deleted from ${okChannels.join(", ")}. ${failedChannels.length} channel${failedChannels.length === 1 ? "" : "s"} failed.`,
						{ id: toastId, duration: 6000 },
					);
					setErrorMessage(
						failedChannels
							.map(
								(r) =>
									`${CHANNEL_LABELS[r.platform] ?? r.platform}: ${r.errorMessage ?? "failed"}`,
							)
							.join("\n"),
					);
				} else {
					toast.error("Delete failed on every channel.", {
						id: toastId,
						duration: 6000,
					});
					setErrorMessage(
						failedChannels
							.map(
								(r) =>
									`${CHANNEL_LABELS[r.platform] ?? r.platform}: ${r.errorMessage ?? "failed"}`,
							)
							.join("\n"),
					);
				}
			} catch (e) {
				const msg = e instanceof Error ? e.message : "Delete failed.";
				toast.error(msg, { id: toastId, duration: 6000 });
				setErrorMessage(msg);
			}
			setConfirmState(null);
		});
	};

	const onPermanentDelete = () => {
		const toastId = toast.loading("Permanently deleting post…");
		startTransition(async () => {
			try {
				await permanentDeletePost(postId);
				toast.success("Post permanently deleted.", { id: toastId });
				setConfirmState(null);
			} catch (e) {
				const msg = e instanceof Error ? e.message : "Delete failed.";
				toast.error(msg, { id: toastId, duration: 6000 });
				setErrorMessage(msg);
				setConfirmState(null);
			}
		});
	};

	return (
		<>
			<Popover open={menuOpen} onOpenChange={setMenuOpen}>
				<PopoverTrigger
					aria-label="Post actions"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
					className={cn(
						"inline-flex items-center justify-center w-8 h-8 rounded-full text-ink/50 hover:text-ink hover:bg-muted/80 transition-colors",
						menuOpen && "bg-muted/80 text-ink",
					)}
				>
					<MoreHorizontal className="w-4 h-4" />
				</PopoverTrigger>
				<PopoverContent
					align="end"
					sideOffset={6}
					className="w-60 p-1 gap-0"
					onClick={(e) => {
						// Row is wrapped in a <Link> — stop clicks inside the popover
						// from bubbling and triggering navigation.
						e.stopPropagation();
					}}
				>
					{isDeleted ? (
						// Deleted posts: show permanent delete option
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setMenuOpen(false);
								setConfirmState({ type: "permanent" });
							}}
							className="w-full flex items-start gap-2 px-3 py-2.5 rounded-xl text-left hover:bg-muted/60 transition-colors"
						>
							<AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
							<div>
								<div className="text-[13px] text-ink font-medium">
									Delete permanently
								</div>
								<div className="text-[11.5px] text-ink/55 leading-[1.4]">
									Removes immediately. Cannot be undone.
								</div>
							</div>
						</button>
					) : (
						<>
							{/* Published posts: show both platform delete and soft delete */}
							{canDeleteFromPlatform && (
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setMenuOpen(false);
										setConfirmState({ type: "delete", mode: "remote" });
									}}
									className="w-full flex items-start gap-2 px-3 py-2.5 rounded-xl text-left hover:bg-muted/60 transition-colors"
								>
									<Trash2 className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
									<div>
										<div className="text-[13px] text-ink font-medium">
											Delete from {platformsSummary(platforms)}
										</div>
										<div className="text-[11.5px] text-ink/55 leading-[1.4]">
											Removes the live post too.
										</div>
									</div>
								</button>
								)}
								{/* All non-deleted posts: show soft delete */}
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setMenuOpen(false);
										setConfirmState({ type: "delete", mode: "local" });
									}}
									className="w-full flex items-start gap-2 px-3 py-2.5 rounded-xl text-left hover:bg-muted/60 transition-colors"
								>
									<Trash2 className="w-3.5 h-3.5 mt-0.5 text-ink/60 shrink-0" />
									<div>
										<div className="text-[13px] text-ink font-medium">
											{canDeleteFromPlatform
												? "Remove from Aloha only"
												: "Delete post"}
										</div>
										<div className="text-[11.5px] text-ink/55 leading-[1.4]">
											{canDeleteFromPlatform
												? "Keeps the live post; moves to deleted."
												: "Moves to deleted. Auto-removed after 30 days."}
										</div>
									</div>
								</button>
							</>
						)}
					</PopoverContent>
				</Popover>

			{/* Soft Delete Confirm Dialog */}
			<ConfirmDialog
				isOpen={confirmState?.type === "delete"}
				onClose={() => {
					if (!isPending) setConfirmState(null);
				}}
				onConfirm={() => {
					if (confirmState?.type === "delete") {
						onSoftDelete(confirmState.mode);
					}
				}}
				title={
					confirmState?.type === "delete" && confirmState.mode === "remote"
						? `Delete from ${platformsSummary(platforms)}?`
						: canDeleteFromPlatform
							? "Remove this post?"
							: "Delete this post?"
				}
				description={
					confirmState?.type === "delete" && confirmState.mode === "remote"
						? "We'll call each platform's delete API and move the post to deleted. It will be permanently removed after 30 days."
						: canDeleteFromPlatform
							? "The live post stays up on platforms. Post moves to deleted and will be permanently removed after 30 days."
							: "Post moves to deleted and will be permanently removed after 30 days."
				}
				confirmText={isPending ? "Deleting…" : "Delete"}
				variant="destructive"
			/>

			{/* Permanent Delete Confirm Dialog */}
			<ConfirmDialog
				isOpen={confirmState?.type === "permanent"}
				onClose={() => {
					if (!isPending) setConfirmState(null);
				}}
				onConfirm={onPermanentDelete}
				title="Delete permanently?"
				description="This post will be immediately and permanently removed from Aloha. This action cannot be undone."
				confirmText={isPending ? "Deleting…" : "Delete permanently"}
				variant="destructive"
			/>

			<ConfirmDialog
				isOpen={errorMessage !== null}
				onClose={() => setErrorMessage(null)}
				onConfirm={() => setErrorMessage(null)}
				title="Couldn't fully delete"
				description={
					<span className="whitespace-pre-wrap">{errorMessage}</span>
				}
				confirmText="Dismiss"
				cancelText="Close"
				variant="default"
			/>
		</>
	);
}

function platformsSummary(platforms: string[]): string {
	if (platforms.length === 0) return "platform";
	if (platforms.length === 1) {
		return CHANNEL_LABELS[platforms[0]] ?? platforms[0];
	}
	if (platforms.length === 2) {
		return `${CHANNEL_LABELS[platforms[0]] ?? platforms[0]} + ${CHANNEL_LABELS[platforms[1]] ?? platforms[1]}`;
	}
	return `${platforms.length} platforms`;
}
