"use client";

// Plan idea card — client-side because it carries expand/collapse + a
// select-all-in-week handshake. The form it posts into lives higher up; this
// card only renders the checkbox + preview. Expanded state shows hook / beats
// / CTA / hashtags / media suggestion / rationale so the user can judge the
// draft without opening the composer.

import { ChannelChip } from "@/components/channel-chip";
import type { PlanIdea } from "@/lib/ai/plan";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Props = {
	idea: PlanIdea;
	formId: string;
	// Collapsed/expanded is per-card. Passing a controlled `expanded` prop
	// lets the parent bulk-expand a whole week.
	defaultExpanded?: boolean;
};

export function IdeaCard({ idea, formId, defaultExpanded = false }: Props) {
	const accepted = Boolean(idea.accepted);
	const [expanded, setExpanded] = useState(defaultExpanded);

	const hasRichScaffolding =
		Boolean(idea.hook) ||
		(idea.keyPoints && idea.keyPoints.length > 0) ||
		Boolean(idea.cta) ||
		Boolean(idea.mediaSuggestion) ||
		(idea.hashtags && idea.hashtags.length > 0) ||
		Boolean(idea.rationale);

	return (
		<li
			className={cn(
				"rounded-2xl border transition-colors",
				accepted
					? "border-primary/40 bg-primary-soft/30"
					: "border-border-strong bg-background-elev",
			)}
		>
			<div className="p-4 flex items-start gap-3">
				<input
					type="checkbox"
					name="ideaIds"
					value={idea.id}
					form={formId}
					disabled={accepted}
					defaultChecked={!accepted}
					data-idea-checkbox
					className="mt-1 accent-ink"
				/>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-[0.16em] text-ink/55">
						<ChannelChip channel={idea.channel} />
						<span aria-hidden>·</span>
						<span>{idea.format}</span>
						{accepted ? (
							<span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ink text-background tracking-wide">
								<Check className="w-3 h-3" />
								Drafted
							</span>
						) : null}
					</div>
					<p className="mt-1.5 text-[14.5px] text-ink font-medium leading-[1.3]">
						{idea.title}
					</p>
					{idea.hook ? (
						<p className="mt-1.5 text-[13px] text-ink/85 leading-[1.55] italic">
							“{idea.hook}”
						</p>
					) : idea.angle ? (
						<p className="mt-1 text-[13px] text-ink/70 leading-[1.55]">
							{idea.angle}
						</p>
					) : null}

					{hasRichScaffolding && expanded ? (
						<div className="mt-3 pt-3 border-t border-border space-y-3">
							{idea.rationale ? (
								<Row label="Why">
									<p className="text-[12.5px] text-ink/70 leading-[1.55]">
										{idea.rationale}
									</p>
								</Row>
							) : null}
							{idea.angle && idea.hook ? (
								<Row label="Angle">
									<p className="text-[12.5px] text-ink/70 leading-[1.55]">
										{idea.angle}
									</p>
								</Row>
							) : null}
							{idea.keyPoints && idea.keyPoints.length > 0 ? (
								<Row label="Beats">
									<ol className="space-y-1">
										{idea.keyPoints.map((k, i) => (
											<li
												key={i}
												className="text-[12.5px] text-ink/75 leading-[1.55] pl-5 -indent-5"
											>
												<span className="text-ink/45 mr-1.5">{i + 1}.</span>
												{k}
											</li>
										))}
									</ol>
								</Row>
							) : null}
							{idea.cta ? (
								<Row label="CTA">
									<p className="text-[12.5px] text-ink/80 italic leading-[1.55]">
										“{idea.cta}”
									</p>
								</Row>
							) : null}
							{idea.hashtags && idea.hashtags.length > 0 ? (
								<Row label="Hashtags">
									<div className="flex flex-wrap gap-1.5">
										{idea.hashtags.map((h) => (
											<span
												key={h}
												className="inline-flex items-center h-5 px-2 rounded-full bg-background border border-border text-[11px] text-ink/75"
											>
												{h}
											</span>
										))}
									</div>
								</Row>
							) : null}
							{idea.mediaSuggestion ? (
								<Row label="Media">
									<p className="text-[12.5px] text-ink/70 leading-[1.55]">
										{idea.mediaSuggestion}
									</p>
								</Row>
							) : null}
						</div>
					) : null}

					<div className="mt-2.5 flex items-center gap-3 text-[12px]">
						{hasRichScaffolding ? (
							<button
								type="button"
								onClick={() => setExpanded((v) => !v)}
								className="inline-flex items-center gap-1 text-ink/55 hover:text-ink transition-colors"
							>
								{expanded ? (
									<>
										<ChevronUp className="w-3.5 h-3.5" />
										Hide details
									</>
								) : (
									<>
										<ChevronDown className="w-3.5 h-3.5" />
										Preview draft
									</>
								)}
							</button>
						) : null}
						{accepted && idea.acceptedPostId ? (
							<Link
								href={`/app/composer?post=${idea.acceptedPostId}`}
								className="inline-flex items-center gap-1 text-ink/60 hover:text-ink transition-colors"
							>
								Open draft →
							</Link>
						) : null}
					</div>
				</div>
			</div>
		</li>
	);
}

function Row({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="grid grid-cols-[80px_1fr] gap-3 items-start">
			<span className="pt-px text-[10.5px] uppercase tracking-[0.18em] text-ink/50 font-medium">
				{label}
			</span>
			<div className="min-w-0">{children}</div>
		</div>
	);
}
