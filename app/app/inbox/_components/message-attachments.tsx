import { FileIcon, Mic, Video } from "lucide-react";
import { cn } from "@/lib/utils";

type Attachment = {
  type: string;
  url: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  altText?: string;
  durationSec?: number;
  fileName?: string;
};

export function MessageAttachments({
  attachments,
  isOutbound,
  sameAsPrev,
  sameAsNext,
}: {
  attachments: Attachment[];
  isOutbound: boolean;
  sameAsPrev: boolean;
  sameAsNext: boolean;
}) {
  // Visual rules: a single image/video gets a constrained natural-aspect
  // tile. Two side-by-side. Three+ collapse into a 2-column grid.
  const visuals = attachments.filter(
    (a) => a.type === "image" || a.type === "gif" || a.type === "video",
  );
  const others = attachments.filter(
    (a) => a.type === "audio" || a.type === "file",
  );

  return (
    <div className="flex flex-col gap-1.5">
      {visuals.length > 0 ? (
        <div
          className={cn(
            "overflow-hidden",
            visuals.length === 1
              ? ""
              : visuals.length === 2
                ? "grid grid-cols-2 gap-0.5"
                : "grid grid-cols-2 gap-0.5",
            "rounded-2xl",
            isOutbound
              ? cn("rounded-br-md", sameAsPrev && "rounded-tr-md", sameAsNext && "rounded-br-2xl")
              : cn("rounded-bl-md", sameAsPrev && "rounded-tl-md", sameAsNext && "rounded-bl-2xl"),
          )}
        >
          {visuals.map((a, i) => (
            <VisualTile
              key={i}
              attachment={a}
              single={visuals.length === 1}
            />
          ))}
        </div>
      ) : null}
      {others.map((a, i) => (
        <FileTile key={i} attachment={a} isOutbound={isOutbound} />
      ))}
    </div>
  );
}

function VisualTile({
  attachment,
  single,
}: {
  attachment: Attachment;
  single: boolean;
}) {
  if (attachment.type === "video") {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block bg-black"
        style={
          single && attachment.width && attachment.height
            ? { aspectRatio: `${attachment.width} / ${attachment.height}` }
            : { aspectRatio: "1 / 1" }
        }
      >
        {attachment.previewUrl ? (
          <img
            src={attachment.previewUrl}
            alt={attachment.altText ?? ""}
            className="w-full h-full object-cover"
          />
        ) : null}
        <span className="absolute inset-0 grid place-items-center">
          <span className="w-12 h-12 rounded-full bg-black/55 grid place-items-center">
            <Video className="w-5 h-5 text-white" />
          </span>
        </span>
      </a>
    );
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-muted"
      style={
        single && attachment.width && attachment.height
          ? { aspectRatio: `${attachment.width} / ${attachment.height}` }
          : { aspectRatio: "1 / 1" }
      }
    >
      <img
        src={attachment.url}
        alt={attachment.altText ?? ""}
        className="w-full h-full object-cover"
      />
    </a>
  );
}

function FileTile({
  attachment,
  isOutbound,
}: {
  attachment: Attachment;
  isOutbound: boolean;
}) {
  const Icon = attachment.type === "audio" ? Mic : FileIcon;
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-[13px]",
        isOutbound
          ? "bg-primary text-primary-foreground"
          : "bg-muted/60 text-ink",
      )}
    >
      <span
        className={cn(
          "w-8 h-8 rounded-full grid place-items-center shrink-0",
          isOutbound ? "bg-primary-foreground/10" : "bg-background",
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="flex-1 min-w-0 truncate">
        {attachment.fileName ?? "Attachment"}
      </span>
    </a>
  );
}
