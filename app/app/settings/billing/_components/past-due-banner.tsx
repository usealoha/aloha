import { AlertTriangle, ArrowUpRight } from "lucide-react";

export function PastDueBanner() {
	return (
		<div
			role="alert"
			className="rounded-2xl border border-destructive/40 bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)] px-5 py-4 flex flex-wrap items-start gap-4"
		>
			<span className="mt-[2px] w-9 h-9 rounded-full bg-background border border-destructive/40 grid place-items-center shrink-0">
				<AlertTriangle className="w-4 h-4 text-destructive" />
			</span>
			<div className="flex-1 min-w-0">
				<p className="text-[13.5px] text-ink font-medium">
					Your last charge didn&apos;t go through.
				</p>
				<p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
					We couldn&apos;t collect payment on your latest invoice. Your plan
					is still active, but we&apos;ll need an updated payment method soon
					to avoid interruption.
				</p>
			</div>
			<form action="/api/billing/portal" method="post">
				<button
					type="submit"
					className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-destructive transition-colors"
				>
					Update payment method
					<ArrowUpRight className="w-3.5 h-3.5" />
				</button>
			</form>
		</div>
	);
}
