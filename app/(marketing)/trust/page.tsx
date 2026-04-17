import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Check,
	FileText,
	Globe,
	KeyRound,
	Lock,
	Mail,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Trust center — what we actually do with your data",
	description:
		"Aloha's security posture, subprocessor list, and how to report a vulnerability — plainly written, no enterprise theatre.",
	path: routes.trust,
});

const SNAPSHOT = [
	{
		icon: Lock,
		label: "Encryption",
		value: "TLS 1.3 · AES-256",
		sub: "In transit and at rest, via managed cloud keys",
	},
	{
		icon: ShieldCheck,
		label: "Certifications",
		value: "None yet",
		sub: "Indie project, no SOC 2 or ISO 27001 — we'll say so when that changes",
	},
	{
		icon: Globe,
		label: "Hosting",
		value: "AWS · US",
		sub: "us-east-1. SCCs cover EU/UK transfers.",
	},
	{
		icon: KeyRound,
		label: "Access",
		value: "MFA + audit log",
		sub: "Just one operator today — least-privilege is trivial to enforce",
	},
];

const SUBPROCESSORS = [
	{
		name: "Amazon Web Services",
		purpose: "Hosting, compute, storage",
		region: "US",
	},
	{
		name: "Cloudflare",
		purpose: "CDN, DDoS protection, image processing",
		region: "Global edge",
	},
	{ name: "Stripe / Polar", purpose: "Payment processing", region: "US, EU" },
	{ name: "Postmark", purpose: "Transactional email", region: "US" },
	{
		name: "Upstash (QStash)",
		purpose: "Scheduled job delivery",
		region: "US",
	},
	{
		name: "Vercel",
		purpose: "Application hosting, edge runtime",
		region: "Global edge",
	},
	{
		name: "AI inference providers",
		purpose:
			"Third-party model providers used to power Muse generation and voice features. Specific providers listed in our Data Processing Addendum.",
		region: "US, EU",
	},
];

const CONTACTS = [
	{
		role: "Security",
		email: "security@usealoha.app",
		note: "Vulnerabilities and incident reports",
	},
	{
		role: "Privacy",
		email: "privacy@usealoha.app",
		note: "Data access, export, and deletion requests",
	},
	{
		role: "Anything else",
		email: "hello@usealoha.app",
		note: "General questions reach me directly",
	},
];

export default function TrustPage() {
	return (
		<>
			{/* ─── HERO ────────────────────────────────────────────────────── */}
			<header className="relative overflow-hidden bg-peach-200 pb-20 lg:pb-24">
				<span
					aria-hidden
					className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[68%] right-[8%] font-display text-[22px] text-primary/55 rotate-14 select-none"
				>
					+
				</span>
				<span
					aria-hidden
					className="absolute top-[28%] right-[6%] font-display text-[38px] text-ink/15 rotate-18 select-none"
				>
					※
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
					<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
						<div className="max-w-3xl">
							<div className="inline-flex items-center gap-3 mb-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
								Trust center
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
								Plain facts,
								<br />
								<span className="text-primary font-light">
									no theatre.
								</span>
							</h1>
							<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
								Aloha is an indie project. There's no SOC 2 badge to show and
								no compliance team to forward your questionnaire to. Here's
								what actually happens to your data — encryption, hosting,
								third parties, and how to reach me if something breaks.
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<a
								href="mailto:security@usealoha.app"
								className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
							>
								<Mail className="w-3.5 h-3.5" />
								Report a vulnerability
							</a>
							<Link
								href={routes.legal.security}
								className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-background-elev border border-border-strong text-[13px] font-medium hover:bg-muted transition-colors"
							>
								Read the full security doc
								<ArrowUpRight className="w-3.5 h-3.5" />
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* ─── SNAPSHOT ────────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-12 pb-8! lg:py-16 bg-background">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
							{SNAPSHOT.map((s) => (
								<div
									key={s.label}
									className="p-7 rounded-3xl bg-background-elev border border-border"
								>
									<s.icon className="w-6 h-6 text-primary" />
									<p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
										{s.label}
									</p>
									<p className="mt-2 font-display text-[26px] leading-[1.05] tracking-[-0.015em]">
										{s.value}
									</p>
									<p className="mt-3 text-[12.5px] text-ink/65 leading-normal">
										{s.sub}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* ─── WHAT WE DON'T HAVE YET ──────────────────────────────────── */}
				<section className="py-20 lg:py-24 bg-background wavy pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-10 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Honest about the gaps
								</p>
								<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
									What we don't have
									<span className="text-primary"> yet.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-5 text-[15px] text-ink/70 leading-[1.55]">
								If a vendor questionnaire requires any of the below, Aloha
								probably isn't the right fit today. We'd rather say so up
								front.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
							{[
								{
									h: "No formal certifications",
									p: "No SOC 2, ISO 27001, HIPAA, or PCI attestation. We follow the practices these frameworks describe, but there's no auditor's letter to send you.",
								},
								{
									h: "Single-region hosting",
									p: "Everything runs in AWS us-east-1. We don't offer EU-resident data today; if that's a hard requirement for your organisation, we aren't the right tool yet.",
								},
								{
									h: "No 24/7 on-call rotation",
									p: "It's one person. Incident response is best-effort and transparent — we tell you what happened and when, without pretending there's a war room.",
								},
								{
									h: "No bounty programme",
									p: "We'll thank good-faith security researchers publicly and won't pursue legal action — but there's no paid bounty on offer today.",
								},
							].map((c) => (
								<article
									key={c.h}
									className="p-7 rounded-3xl bg-background-elev border border-border"
								>
									<p className="font-display text-[20px] leading-[1.2] tracking-[-0.005em]">
										{c.h}
									</p>
									<p className="mt-3 text-[13.5px] text-ink/70 leading-[1.55]">
										{c.p}
									</p>
								</article>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── SUBPROCESSORS ───────────────────────────────────────────── */}
			<section
				className="py-20 lg:py-24 bg-background-elev wavy pb-32 lg:pb-40"
				id="subprocessors"
			>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-10 items-end">
						<div className="col-span-12 lg:col-span-7">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Subprocessors
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								Every third party
								<br />
								<span className="text-primary">that touches your data.</span>
							</h2>
						</div>
						<p className="col-span-12 lg:col-span-5 text-[15px] text-ink/70 leading-[1.55]">
							If this list changes materially, the privacy policy's "last
							updated" date moves and the change is noted on the changelog.
						</p>
					</div>

					<div className="rounded-3xl border border-border overflow-hidden bg-background">
						<div className="grid grid-cols-12 border-b border-border bg-muted/40 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
							<div className="col-span-5 px-6 py-4">Subprocessor</div>
							<div className="col-span-5 px-6 py-4 border-l border-border">
								Purpose
							</div>
							<div className="col-span-2 px-6 py-4 border-l border-border">
								Region
							</div>
						</div>
						{SUBPROCESSORS.map((s, i) => (
							<div
								key={s.name}
								className={`grid grid-cols-12 border-b border-border last:border-b-0 ${
									i % 2 === 1 ? "bg-muted/15" : ""
								}`}
							>
								<div className="col-span-5 px-6 py-4 font-medium text-ink text-[14.5px]">
									{s.name}
								</div>
								<div className="col-span-5 px-6 py-4 border-l border-border text-[13.5px] text-ink/75">
									{s.purpose}
								</div>
								<div className="col-span-2 px-6 py-4 border-l border-border text-[12px] font-mono text-ink/60">
									{s.region}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ─── DATA TRANSFERS ──────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-20 lg:py-24 bg-background wavy pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
						<div className="col-span-12 lg:col-span-7">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Data transfers
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								One region,
								<br />
								<span className="text-primary">standard safeguards.</span>
							</h2>
							<p className="mt-6 text-[16px] text-ink/75 leading-[1.6] max-w-lg">
								Your data lives in AWS us-east-1. For customers in the EU and
								UK, the transfer is covered by Standard Contractual Clauses
								and the UK IDTA — linked from the DPA.
							</p>

							<ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
								{[
									"Automated database snapshots stored in a separate AWS account.",
									"EU Standard Contractual Clauses + UK IDTA cover cross-border transfers.",
									"Hard delete on account removal; residual backups purged within 30 days.",
								].map((f) => (
									<li key={f} className="flex items-start gap-3">
										<Check
											className="w-4 h-4 mt-[3px] text-primary shrink-0"
											strokeWidth={2.5}
										/>
										{f}
									</li>
								))}
							</ul>
						</div>
					</div>
				</section>
			</section>

			{/* ─── LEGAL CARDS ─────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 opacity-20 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-20 lg:py-24 bg-background-elev wavy pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-12">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Go deeper
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								The commitments,
								<span className="text-primary"> in full.</span>
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
							<Link
								href={routes.resources.status}
								className="group p-8 rounded-3xl bg-background border border-border hover:bg-muted/30 transition-colors flex flex-col min-h-[220px]"
							>
								<div className="flex items-center gap-2 mb-6">
									<span className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/55">
										Status page
									</span>
								</div>
								<h3 className="font-display text-[24px] leading-[1.15] tracking-[-0.01em]">
									Coming soon.
								</h3>
								<p className="mt-3 text-[13.5px] text-ink/65 leading-[1.55]">
									We're building a live health page. In the meantime, write
									security@ if something looks off.
								</p>
								<span className="mt-auto pt-6 pencil-link text-[13px] text-ink font-medium inline-flex items-center gap-2">
									Open the status page
									<ArrowUpRight className="w-3.5 h-3.5" />
								</span>
							</Link>

							<div className="p-8 rounded-3xl bg-peach-100 flex flex-col min-h-[220px]">
								<FileText className="w-6 h-6 text-ink mb-4" />
								<p className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/55">
									Legal docs
								</p>
								<ul className="mt-3 space-y-2.5 flex-1">
									{[
										{ h: routes.legal.privacy, l: "Privacy policy" },
										{ h: routes.legal.terms, l: "Terms of service" },
										{ h: routes.legal.dpa, l: "Data Processing Addendum" },
										{ h: routes.legal.security, l: "Security page" },
										{ h: routes.legal.cookies, l: "Cookie policy" },
										{ h: routes.legal.responsibleAi, l: "Responsible AI" },
									].map((l) => (
										<li key={l.h}>
											<Link
												href={l.h}
												className="group inline-flex items-center gap-1.5 text-[13.5px] text-ink pencil-link"
											>
												{l.l}
												<ArrowUpRight className="w-3 h-3 text-ink/40 group-hover:text-primary transition-colors" />
											</Link>
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</section>
			</section>

			{/* ─── CONTACTS ───────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 opacity-20 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-20 lg:py-24 bg-background-elev wavy pb-32 lg:pb-40">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-12">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Who to write to
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								Three inboxes,
								<span className="text-primary"> one person.</span>
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
							{CONTACTS.map((c) => (
								<a
									key={c.email}
									href={`mailto:${c.email}`}
									className="group p-7 rounded-3xl bg-background border border-border hover:bg-muted/30 transition-colors flex flex-col justify-between min-h-[180px]"
								>
									<div>
										<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
											{c.role}
										</p>
										<p className="mt-4 font-display text-[19px] text-ink leading-[1.2] tracking-[-0.005em] break-all">
											{c.email}
										</p>
									</div>
									<p className="mt-4 text-[12.5px] text-ink/60 leading-[1.55]">
										{c.note}
									</p>
								</a>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ───────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink text-background-elev wavy">
				<div
					aria-hidden
					className="absolute inset-0 opacity-20 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-28 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[40px] sm:text-[52px] lg:text-[72px] leading-[0.98] tracking-[-0.025em]">
								We don't ask for trust.
								<br />
								<span className="text-peach-300">We earn it slowly.</span>
							</h2>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<Link
								href={routes.signin}
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full font-medium text-[15px] bg-primary transition-colors"
							>
								Start on a plan
								<ArrowRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
