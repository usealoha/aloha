import { NextResponse, type NextRequest } from "next/server";
import { channelNotificationEmail } from "@/lib/email/templates/channel-notification";
import { welcomeEmail } from "@/lib/email/templates/welcome";
import { channelLabel } from "@/components/channel-chip";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

type Rendered = { subject: string; html: string; text: string };

function render(searchParams: URLSearchParams): Rendered | { error: string } {
  const template = searchParams.get("template") ?? "channel-notification";
  const name = searchParams.get("name");

  if (template === "channel-notification") {
    const channel = searchParams.get("channel") ?? "tiktok";
    return channelNotificationEmail({
      name,
      channelLabel: channelLabel(channel),
    });
  }

  if (template === "welcome") {
    return welcomeEmail({
      name,
      appUrl: env.APP_URL,
    });
  }

  return { error: `unknown template: ${template}` };
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const result = render(searchParams);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }

  const format = searchParams.get("format");
  if (format === "text") {
    return new NextResponse(result.text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (format === "json") {
    return NextResponse.json(result);
  }

  const preview = `<!doctype html>
<html><head><meta charset="utf-8"><title>${result.subject}</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#1a1612;color:#f6f1e4;}
.meta{padding:16px 24px;border-bottom:1px solid #333;font-size:13px;}
.meta code{background:#2a241e;padding:2px 6px;border-radius:4px;}
iframe{width:100%;height:calc(100vh - 60px);border:0;background:#f6f1e4;}</style>
</head><body>
<div class="meta">Subject: <code>${result.subject.replace(/</g, "&lt;")}</code></div>
<iframe srcdoc="${result.html.replace(/"/g, "&quot;")}"></iframe>
</body></html>`;

  return new NextResponse(preview, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
