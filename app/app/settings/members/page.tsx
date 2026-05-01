import Link from "next/link";
import { Mail, Sparkles, UserPlus } from "lucide-react";
import { getCurrentContext } from "@/lib/current-context";
import { listWorkspaceMembers } from "@/app/actions/workspace-members";
import { listPendingInvites } from "@/app/actions/workspace-invites";
import { hasRole, ROLES } from "@/lib/workspaces/roles";
import { getAccountSeatEntitlement } from "@/lib/billing/workspace-limits";
import { MembersList } from "./_components/members-list";
import { InviteForm } from "./_components/invite-form";
import { PendingInvitesList } from "./_components/pending-invites";

export const dynamic = "force-dynamic";

export default async function MembersSettingsPage() {
	const ctx = (await getCurrentContext())!;
	const canInvite = hasRole(ctx.role, ROLES.ADMIN);

	const [members, invites, entitlement] = await Promise.all([
		listWorkspaceMembers(),
		canInvite ? listPendingInvites() : Promise.resolve([]),
		canInvite
			? getAccountSeatEntitlement(ctx.workspace.ownerUserId)
			: Promise.resolve(null),
	]);

	return (
		<div className="max-w-3xl space-y-10">
			<header>
				<h1 className="font-display text-[32px] leading-[1.05] tracking-[-0.02em] text-ink">
					Members<span className="text-primary font-light">.</span>
				</h1>
				<p className="mt-2 text-[13.5px] text-ink/65 leading-[1.55]">
					People who can act inside <strong>{ctx.workspace.name}</strong>.
					Roles control what they can do; only owners can change roles.
				</p>
			</header>

			{canInvite ? (
				<section className="space-y-3">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<UserPlus className="w-4 h-4 text-ink/60" />
							<h2 className="text-[13px] font-semibold text-ink">
								Invite someone
							</h2>
						</div>
						{entitlement ? (
							<span className="text-[11.5px] text-ink/55">
								{entitlement.current} / {entitlement.limit} seats used
							</span>
						) : null}
					</div>
					{entitlement && !entitlement.allowed ? (
						<div className="rounded-2xl border border-border bg-background-elev p-4 flex items-start gap-3">
							<span className="grid place-items-center w-8 h-8 rounded-full bg-peach-100/70 shrink-0">
								<Sparkles className="w-3.5 h-3.5 text-ink" />
							</span>
							<div className="min-w-0 flex-1">
								<p className="text-[13px] font-medium text-ink">
									Account is at its {entitlement.limit}-seat cap
								</p>
								<p className="mt-0.5 text-[12px] text-ink/65 leading-[1.5]">
									{entitlement.isPaid
										? "Add seats from billing to invite more teammates. Each seat is one human, assignable to any workspace."
										: "Upgrade to invite more teammates. One seat = one human across all your workspaces."}
								</p>
							</div>
							<Link
								href="/app/settings/billing#addons"
								className="inline-flex items-center h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors shrink-0"
							>
								{entitlement.isPaid ? "Add seats" : "Upgrade"}
							</Link>
						</div>
					) : (
						<InviteForm />
					)}
				</section>
			) : null}

			<section className="space-y-3">
				<h2 className="text-[13px] font-semibold text-ink">
					Workspace members
				</h2>
				<MembersList
					members={members}
					viewerRole={ctx.role}
					viewerUserId={ctx.user.id}
				/>
			</section>

			{canInvite && invites.length > 0 ? (
				<section className="space-y-3">
					<div className="flex items-center gap-2">
						<Mail className="w-4 h-4 text-ink/60" />
						<h2 className="text-[13px] font-semibold text-ink">
							Pending invites
						</h2>
					</div>
					<PendingInvitesList invites={invites} />
				</section>
			) : null}
		</div>
	);
}
