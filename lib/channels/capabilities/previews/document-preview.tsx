"use client";

import { FileText } from "lucide-react";
import type { FormPreviewProps } from "@/lib/channels/capabilities/types";
import { readDocumentPayload } from "../editors/document-editor";

export function DocumentPreview({
  payload,
  profile,
  author,
}: FormPreviewProps) {
  const { title, caption, document } = readDocumentPayload(payload);
  const displayName = profile?.displayName ?? author.name;
  const handle = profile?.handle ?? "in/handle";
  const hasDoc = document.length > 0;
  return (
    <article className="w-full max-w-[520px] rounded-2xl border border-border bg-background-elev overflow-hidden shadow-[0_14px_32px_-18px_rgba(26,22,18,0.28)]">
      <header className="px-4 pt-4 flex items-center gap-3">
        <span className="w-10 h-10 rounded-full overflow-hidden border border-border bg-peach-100" />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ink truncate">
            {displayName}
          </p>
          <p className="text-[12px] text-ink/55 truncate">{handle}</p>
        </div>
      </header>
      <div className="px-4 py-3 text-[14px] text-ink whitespace-pre-wrap">
        {caption || (
          <span className="italic text-ink/35">Your caption appears here</span>
        )}
      </div>
      <div className="mx-4 mb-4 rounded-xl border border-border bg-background overflow-hidden">
        <div className="aspect-[4/3] bg-peach-100/40 grid place-items-center">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto text-ink/40" />
            <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-ink/55">
              {hasDoc ? "PDF" : "No document yet"}
            </p>
          </div>
        </div>
        <div className="px-3 py-2 border-t border-border">
          <p className="text-[13px] font-medium text-ink truncate">
            {title || "Untitled document"}
          </p>
        </div>
      </div>
    </article>
  );
}
