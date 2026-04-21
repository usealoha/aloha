import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { automations, users } from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import {
  displayHeading,
  paragraph,
  renderLayout,
  escape,
} from "@/lib/email/layout";
import { captureException } from "@/lib/logger";
import {
  registerAction,
  type ActionContext,
  type ActionResult,
} from "../registry";

// Used by `unsubscribe_spike_alert` and any future operator-facing alerts.
// Config shape:
//   { destination: "email" | "slack" | "both" }
// The automation itself carries the context (name + any upstream condition
// output) so the alert can tell the user which rule fired and what numbers
// triggered it. Slack is not wired yet — slack-only destinations skip with
// a reason so the run log is honest.

function buildAlertBody(
  automationName: string,
  trigger: Record<string, unknown>,
  snapshot: Record<string, unknown>,
): { subject: string; html: string; text: string } {
  const subject = `Aloha alert — ${automationName}`;

  // Surface the most-recent upstream condition / action output if present —
  // usually that's the `rate_over_threshold` payload carrying the concrete
  // numbers that tripped the alert.
  const upstream = Object.values(snapshot)
    .filter((v) => v && typeof v === "object")
    .slice(-1)[0] as Record<string, unknown> | undefined;

  const detailLines: string[] = [];
  if (upstream) {
    for (const [k, v] of Object.entries(upstream)) {
      if (v === null || v === undefined) continue;
      const rendered =
        typeof v === "object" ? JSON.stringify(v) : String(v);
      detailLines.push(`${k}: ${rendered}`);
    }
  }
  if (detailLines.length === 0 && Object.keys(trigger).length > 0) {
    for (const [k, v] of Object.entries(trigger)) {
      if (v === null || v === undefined) continue;
      detailLines.push(`${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
    }
  }

  const detailHtml =
    detailLines.length > 0
      ? paragraph(
          detailLines
            .map((line) => escape(line))
            .join("<br />"),
          { muted: true },
        )
      : "";

  const html = renderLayout({
    preheader: subject,
    body: `
      ${displayHeading(`${escape(automationName)} tripped.`)}
      ${paragraph("One of your Aloha automations hit its threshold. Details below.")}
      ${detailHtml}
    `,
  });

  const text = [
    `${automationName} tripped.`,
    "",
    "One of your Aloha automations hit its threshold.",
    detailLines.length > 0 ? "" : null,
    ...detailLines,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { subject, html, text };
}

registerAction(
  "send_alert",
  async ({
    automationId,
    userId,
    step,
    trigger,
    snapshot,
  }: ActionContext): Promise<ActionResult> => {
    const cfg = step.config ?? {};
    const rawDest = typeof cfg.destination === "string" ? cfg.destination : "email";
    const destination: "email" | "slack" | "both" =
      rawDest === "slack" || rawDest === "both" ? rawDest : "email";

    if (destination === "slack") {
      return {
        output: {
          skipped: true,
          reason: "Slack destination not wired yet; set destination to email or both",
        },
      };
    }

    // Look up the user's email (owner of the workspace) and the automation
    // name for the alert subject.
    const [owner] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!owner?.email) {
      return { output: { skipped: true, reason: "Workspace owner has no email on file" } };
    }

    const [automation] = await db
      .select({ name: automations.name })
      .from(automations)
      .where(eq(automations.id, automationId))
      .limit(1);
    const automationName = automation?.name ?? "Automation";

    const { subject, html, text } = buildAlertBody(
      automationName,
      trigger,
      snapshot,
    );

    try {
      await sendEmail({ to: owner.email, subject, html, text });
    } catch (err) {
      await captureException(err, {
        tags: { source: "automations.send_alert" },
        extra: { automationId, userId },
      });
      throw err;
    }

    return {
      output: {
        sent: true,
        destination,
        to: owner.email,
        slackSkipped: destination === "both",
      },
    };
  },
);
