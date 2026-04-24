"use client";

import { ImagePlus, Loader2, X as XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { PostMedia } from "@/db/schema";
import { cn } from "@/lib/utils";

// Uploads files to /api/upload and returns the PostMedia entries.
// Shared across composer surfaces so every editor gets consistent
// thumbnail behaviour, error handling, and upload limits.

export function MediaPicker({
  media,
  onChange,
  max = 4,
  disabled,
  accept = "image/*,video/*",
  className,
  label = "Attach media",
}: {
  media: PostMedia[];
  onChange: (next: PostMedia[]) => void;
  max?: number;
  disabled?: boolean;
  accept?: string;
  className?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = max - media.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) {
      toast.error(`You can attach up to ${max} files.`);
      return;
    }
    setUploading(true);
    try {
      const uploaded: PostMedia[] = [];
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? `Upload failed (${res.status})`);
        }
        const json = (await res.json()) as { url: string; mimeType: string };
        uploaded.push({ url: json.url, mimeType: json.mimeType });
      }
      onChange([...media, ...uploaded]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (url: string) =>
    onChange(media.filter((m) => m.url !== url));

  const atMax = media.length >= max;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {media.map((m) => (
        <div
          key={m.url}
          className="relative w-16 h-16 rounded-lg overflow-hidden border border-border bg-background-elev"
        >
          {m.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.url}
              alt={m.alt ?? ""}
              className="w-full h-full object-cover"
            />
          ) : m.mimeType.startsWith("video/") ? (
            <video src={m.url} className="w-full h-full object-cover" muted />
          ) : (
            <div className="w-full h-full grid place-items-center text-[10px] text-ink/50">
              {m.mimeType}
            </div>
          )}
          {!disabled ? (
            <button
              type="button"
              onClick={() => remove(m.url)}
              className="absolute top-0.5 right-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-ink/80 text-background hover:bg-ink transition-colors"
              aria-label="Remove media"
            >
              <XIcon className="w-3 h-3" />
            </button>
          ) : null}
        </div>
      ))}
      {!atMax && !disabled ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-dashed border-border text-[12px] font-medium text-ink/70 hover:bg-muted/60 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ImagePlus className="w-3.5 h-3.5" />
          )}
          {label}
          <span className="text-ink/40">
            {media.length}/{max}
          </span>
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}
