// Manual-assist reminder email. Sent when a scheduled post's delivery for
// a gated channel is parked in `manual_assist` state at post-time. Content
// is already pre-formatted for the target platform; the user just needs to
// copy and paste (or click the native deep-link where supported).
//
// Scoped to email only for v1. Push/in-app reminders are follow-ups.

import {
  displayHeading,
  divider,
  escape,
  escapeAttr,
  paragraph,
  primaryButton,
  rawLinkFallback,
  renderLayout,
} from "../layout";

export type ManualAssistEmailInput = {
  name?: string | null;
  platform: string;
  platformName: string;
  postId: string;
  content: string;
  mediaUrls: string[];
  scheduledAt: Date | null;
  appUrl: string;
};

// Deep-link builders for platforms that expose a web compose URL. Unlisted
// platforms fall through to "copy content, open native app" flow.
function composeDeepLink(
  platform: string,
  content: string,
): { href: string; label: string } | null {
  const text = encodeURIComponent(content);
  switch (platform) {
    case "twitter":
      return {
        href: `https://twitter.com/intent/tweet?text=${text}`,
        label: "Open X with this pre-filled",
      };
    case "threads":
      return {
        href: `https://www.threads.net/intent/post?text=${text}`,
        label: "Open Threads with this pre-filled",
      };
    default:
      return null;
  }
}

export function manualAssistEmail(input: ManualAssistEmailInput) {
  const firstName = input.name?.split(" ")[0] ?? null;
  const greeting = firstName ? `Hey ${firstName},` : "Hey,";
  const appUrl = input.appUrl.replace(/\/$/, "");
  const postUrl = `${appUrl}/app/composer?post=${input.postId}`;
  const scheduledLabel = input.scheduledAt
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(input.scheduledAt)
    : null;

  const deepLink = composeDeepLink(input.platform, input.content);

  const mediaBlock =
    input.mediaUrls.length > 0
      ? `
        <p style="margin:16px 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(26,22,18,0.55);">
          Media to attach
        </p>
        <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:rgba(26,22,18,0.8);">
          ${input.mediaUrls
            .map(
              (u) =>
                `<li style="margin:4px 0;"><a href="${escapeAttr(u)}" style="color:#4f46e5;text-decoration:none;word-break:break-all;">${escape(u)}</a></li>`,
            )
            .join("")}
        </ul>
      `
      : "";

  const deepLinkBlock = deepLink
    ? primaryButton(deepLink.label, deepLink.href)
    : "";

  const contentBlock = `
    <pre style="margin:0;padding:16px 18px;background:#fffdf6;border:1px solid #e2d8bf;border-radius:12px;font-family:'SF Mono','Menlo','Consolas',monospace;font-size:13.5px;line-height:1.5;color:#1a1612;white-space:pre-wrap;word-wrap:break-word;">${escape(input.content)}</pre>
  `;

  const body = `
    ${displayHeading(`Time to post on ${escape(input.platformName)}.`)}
    ${paragraph(greeting)}
    ${paragraph(
      `Your ${escape(input.platformName)} post is ready${scheduledLabel ? ` for ${escape(scheduledLabel)}` : ""}. ${escape(input.platformName)} isn't plugged in for direct publishing yet, so here's your content — copy it, paste it, and you're done.`,
    )}
    ${contentBlock}
    ${mediaBlock}
    ${deepLinkBlock}
    ${divider()}
    ${paragraph(
      `When it's live, open the draft in Aloha to mark it done or tweak it for next time.`,
      { muted: true },
    )}
    ${primaryButton("Open the draft in Aloha", postUrl)}
    ${rawLinkFallback(postUrl)}
  `;

  const html = renderLayout({
    preheader: `Your ${input.platformName} post is ready — copy & paste.`,
    body,
  });

  const text = `${greeting}

Your ${input.platformName} post is ready${scheduledLabel ? ` for ${scheduledLabel}` : ""}. ${input.platformName} isn't plugged in for direct publishing yet, so here's the content:

---
${input.content}
---
${
  input.mediaUrls.length > 0
    ? `\nMedia to attach:\n${input.mediaUrls.map((u) => `  • ${u}`).join("\n")}\n`
    : ""
}${deepLink ? `\n${deepLink.label}: ${deepLink.href}\n` : ""}
Open the draft in Aloha to mark it done: ${postUrl}

— Aloha`;

  return {
    subject: `Time to post on ${input.platformName}`,
    html,
    text,
  };
}
