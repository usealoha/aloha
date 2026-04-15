import { Download, FileText } from "lucide-react";
import Link from "next/link";
import type { InvoiceRow } from "@/lib/billing/service";

function formatAmount(cents: number, currency: string) {
	const value = cents / 100;
	const rounded = Math.round(value * 100) / 100;
	const str = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2);
	const symbol = currency.toUpperCase() === "USD" ? "$" : "";
	return `${symbol}${str}${symbol ? "" : " " + currency.toUpperCase()}`;
}

function formatDate(d: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(d);
}

const STATUS_STYLES: Record<string, { label: string; tone: "ok" | "muted" | "warn" }> = {
	paid: { label: "Paid", tone: "ok" },
	refunded: { label: "Refunded", tone: "muted" },
	partially_refunded: { label: "Partially refunded", tone: "muted" },
	pending: { label: "Pending", tone: "warn" },
};

export function InvoicesList({ invoices }: { invoices: InvoiceRow[] }) {
	if (invoices.length === 0) {
		return (
			<section className="rounded-3xl border border-dashed border-border-strong p-6 lg:p-8">
				<div className="flex items-start gap-4">
					<span className="mt-[2px] w-9 h-9 rounded-full bg-background border border-border-strong grid place-items-center shrink-0">
						<FileText className="w-4 h-4 text-ink/55" />
					</span>
					<div>
						<p className="text-[13.5px] text-ink font-medium">
							No invoices yet
						</p>
						<p className="mt-1 text-[12.5px] text-ink/60 leading-[1.55] max-w-2xl">
							Receipts will appear here after your first paid cycle. You can
							also find them in your inbox.
						</p>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className="rounded-3xl border border-border bg-background-elev overflow-hidden">
			<header className="px-6 lg:px-8 py-5 border-b border-border flex items-center justify-between">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Invoices
					</p>
					<h3 className="mt-1 font-display text-[18px] leading-[1.15] tracking-[-0.01em] text-ink">
						Your billing history.
					</h3>
				</div>
				<p className="text-[11.5px] text-ink/50 font-mono">
					{invoices.length} most recent
				</p>
			</header>
			<ul className="divide-y divide-border">
				{invoices.map((inv) => {
					const style = STATUS_STYLES[inv.status] ?? {
						label: inv.status,
						tone: "muted" as const,
					};
					return (
						<li
							key={inv.id}
							className="px-6 lg:px-8 py-4 flex flex-wrap items-center gap-4"
						>
							<div className="flex-1 min-w-0">
								<p className="font-mono text-[12.5px] text-ink/60">
									{inv.invoiceNumber}
								</p>
								<p className="mt-1 text-[13.5px] text-ink font-medium">
									{formatDate(inv.createdAt)}
								</p>
							</div>
							<StatusPill tone={style.tone} label={style.label} />
							<p className="font-display text-[18px] tracking-[-0.005em] tabular-nums w-[90px] text-right">
								{formatAmount(inv.totalAmount, inv.currency)}
							</p>
							<Link
								href={`/api/billing/invoice/${inv.id}`}
								target="_blank"
								rel="noopener"
								className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12.5px] text-ink/65 hover:text-ink hover:bg-peach-100/60 transition-colors"
							>
								<Download className="w-3.5 h-3.5" />
								PDF
							</Link>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

function StatusPill({
	tone,
	label,
}: {
	tone: "ok" | "muted" | "warn";
	label: string;
}) {
	const cls =
		tone === "ok"
			? "bg-peach-100 text-ink"
			: tone === "warn"
				? "bg-primary-soft text-primary-deep"
				: "bg-muted text-ink/65";
	return (
		<span
			className={`inline-flex items-center h-6 px-2.5 rounded-full text-[10.5px] font-medium tracking-wide uppercase ${cls}`}
		>
			{label}
		</span>
	);
}
