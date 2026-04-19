import { escape, escapeAttr, COLORS } from "./layout";
import { unsubscribeUrl } from "./unsubscribe";

// Minimal plain-text → HTML. Broadcasts v1 don't accept rich markdown —
// users type plain text with blank lines between paragraphs. Each non-empty
// block becomes a <p>; single newlines become <br/>. Everything is escaped.
function bodyToHtml(text: string): string {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks
    .map(
      (b) =>
        `<p style="margin:0 0 18px 0;font-size:16px;line-height:1.65;color:${COLORS.ink};">${escape(b).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("\n");
}

function bodyToText(body: string, footer: string): string {
  return `${body.trim()}\n\n---\n${footer}`;
}

const BODY_FONT = `'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

export function renderBroadcast(opts: {
  subject: string;
  preheader?: string | null;
  body: string;
  senderLabel: string;
  subscriberId: string;
  subscriberEmail: string;
}): { html: string; text: string; unsubUrl: string } {
  const unsubUrl = unsubscribeUrl(opts.subscriberId);
  const preheader = opts.preheader ?? "";

  const footerHtml = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;border-top:1px solid ${COLORS.border};padding-top:20px;">
  <tr>
    <td style="font-size:12px;line-height:1.55;color:${COLORS.inkSoft};">
      You're receiving this because you subscribed to ${escape(opts.senderLabel)}.<br/>
      <a href="${escapeAttr(unsubUrl)}" style="color:${COLORS.inkSoft};text-decoration:underline;">Unsubscribe</a> · ${escape(opts.subscriberEmail)}
    </td>
  </tr>
</table>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${escape(opts.subject)}</title>
<style>
  @media (max-width: 600px) {
    .container { width: 100% !important; padding: 24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};color:${COLORS.ink};font-family:${BODY_FONT};-webkit-font-smoothing:antialiased;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
  ${escape(preheader)}
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:${COLORS.elev};border:1px solid ${COLORS.border};border-radius:16px;padding:36px 40px;">
        <tr>
          <td>
            ${bodyToHtml(opts.body)}
            ${footerHtml}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = bodyToText(
    opts.body,
    `You're receiving this because you subscribed to ${opts.senderLabel}.\nUnsubscribe: ${unsubUrl}`,
  );

  return { html, text, unsubUrl };
}
