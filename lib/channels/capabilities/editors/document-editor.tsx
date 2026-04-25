"use client";

import { FileText } from "lucide-react";
import { MediaPicker } from "@/components/media-picker";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";
import {
  readDocumentPayload,
  type DocumentPayload,
} from "./document-payload";

export {
  readDocumentPayload,
  type DocumentPayload,
} from "./document-payload";

const TITLE_MAX = 100;
const CAPTION_MAX = 3000;

export function DocumentEditor({
  payload,
  onChange,
  disabled,
}: FormEditorProps) {
  const { title, caption, document } = readDocumentPayload(payload);
  const update = (next: Partial<DocumentPayload>) =>
    onChange({
      ...payload,
      title: next.title ?? title,
      caption: next.caption ?? caption,
      document: next.document ?? document,
    } satisfies DocumentPayload);
  const captionRemaining = CAPTION_MAX - caption.length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          PDF document
        </span>
        {document.length === 0 ? (
          <MediaPicker
            media={[]}
            onChange={(next) => {
              const pdf = next.find((m) => m.mimeType === "application/pdf");
              if (pdf) update({ document: [pdf] });
            }}
            max={1}
            accept="application/pdf"
            disabled={disabled}
            label="Upload PDF"
          />
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
            <FileText className="w-5 h-5 text-ink/55" />
            <a
              href={document[0].url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-[13px] text-ink hover:underline truncate"
            >
              {document[0].url.split("/").pop() ?? "Uploaded PDF"}
            </a>
            <button
              type="button"
              onClick={() => update({ document: [] })}
              disabled={disabled}
              className="text-[12px] text-ink/55 hover:text-ink transition-colors disabled:opacity-50"
            >
              Replace
            </button>
          </div>
        )}
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Document title
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => update({ title: e.target.value })}
          disabled={disabled}
          maxLength={TITLE_MAX}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[14.5px] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
          placeholder="The name LinkedIn shows under your post"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Caption
        </span>
        <textarea
          value={caption}
          onChange={(e) => update({ caption: e.target.value })}
          disabled={disabled}
          rows={8}
          className="w-full rounded-2xl border border-border bg-background p-3 text-[14.5px] leading-[1.55] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
          placeholder="Add context for the document"
        />
        <span
          className={
            captionRemaining < 50
              ? "self-end text-[11px] text-amber-600"
              : "self-end text-[11px] text-ink/55"
          }
        >
          {captionRemaining}
        </span>
      </label>
    </div>
  );
}
