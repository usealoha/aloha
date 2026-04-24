import {
	displayHeading,
	paragraph,
	primaryButton,
	renderLayout,
} from "../layout";
import { env } from "@/lib/env";

// Sent to the workspace owner when the quota reconciler flips
// `workspaces.frozenAt` — they're over their seat allowance and
// publishing/invites are paused until they fix billing or remove
// another workspace.
export function workspaceFrozenEmail({
	workspaceName,
}: {
	workspaceName: string;
}) {
	const billingUrl = `${env.APP_URL.replace(/\/$/, "")}/app/settings/billing#workspaces`;

	const body = `
    ${displayHeading(`${workspaceName} is paused.`)}
    ${paragraph(
			`You're over your current workspace seat allowance, so publishing and invites on <strong style="font-weight:500;">${workspaceName}</strong> are paused. Everything you've created is safe — the workspace is just read-only until you resolve this.`,
		)}
    ${paragraph(`You have two ways to fix it:`)}
    ${paragraph(`• Add a workspace seat in billing to restore this tenant, or`)}
    ${paragraph(`• Delete another workspace to free one up.`)}
    ${primaryButton("Open billing", billingUrl)}
    ${paragraph(
			`Scheduled posts that were queued before the pause will resume automatically once the workspace thaws.`,
		)}
  `;

	const text = `${workspaceName} is paused.

You're over your current workspace seat allowance, so publishing and invites on ${workspaceName} are paused. Everything you've created is safe — the workspace is just read-only until you resolve this.

Fix it one of two ways:
 • Add a workspace seat: ${billingUrl}
 • Or delete another workspace to free one up.

Scheduled posts resume automatically once the workspace thaws.`;

	return {
		subject: `${workspaceName} is paused — add seats to resume publishing`,
		html: renderLayout({
			preheader: `You're over your seat allowance. Fix billing to resume publishing on ${workspaceName}.`,
			body,
		}),
		text,
	};
}
