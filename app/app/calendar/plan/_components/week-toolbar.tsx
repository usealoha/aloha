"use client";

// Week header actions — select-all / clear-all for the week's pending ideas,
// rendered alongside the week label. The checkboxes themselves live inside
// `IdeaCard` and are data-attributed so the toolbar can flip them without a
// prop drill. Accepted ideas are disabled and skipped.

import { CheckCheck, Square } from "lucide-react";
import { useCallback } from "react";

export function WeekToolbar({ weekKey }: { weekKey: string }) {
	const setAll = useCallback(
		(value: boolean) => {
			const week = document.querySelector<HTMLElement>(
				`[data-week="${weekKey}"]`,
			);
			if (!week) return;
			const boxes = week.querySelectorAll<HTMLInputElement>(
				"input[type=checkbox][data-idea-checkbox]:not(:disabled)",
			);
			boxes.forEach((b) => {
				b.checked = value;
			});
		},
		[weekKey],
	);

	return (
		<div className="flex items-center gap-1">
			<button
				type="button"
				onClick={() => setAll(true)}
				className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] text-ink/60 hover:text-ink hover:bg-background transition-colors"
			>
				<CheckCheck className="w-3 h-3" />
				All
			</button>
			<button
				type="button"
				onClick={() => setAll(false)}
				className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] text-ink/60 hover:text-ink hover:bg-background transition-colors"
			>
				<Square className="w-3 h-3" />
				None
			</button>
		</div>
	);
}
