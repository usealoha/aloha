import { Heart, MessageSquare, Repeat2, Share, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Platform } from "./composer";

type Author = {
  name: string;
  email: string;
  image: string | null;
};

export function PreviewCard({
  platform,
  author,
  content,
}: {
  platform: Platform;
  author: Author;
  content: string;
}) {
  const displayName = author.name;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  const text = content.trim().length > 0 ? content : null;

  return (
    <article className="rounded-2xl border border-border bg-background-elev overflow-hidden">
      <header className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full overflow-hidden border border-border bg-peach-100 grid place-items-center text-[12px] font-semibold text-ink">
            {author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={author.image}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              initials || "A"
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-ink leading-tight truncate">
              {displayName}
            </p>
            <p className="text-[12px] text-ink/55 leading-tight truncate">
              {platform.handle} · just now
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium tracking-wide",
            platform.accent,
          )}
        >
          {platform.name}
        </span>
      </header>

      <div className="px-5 py-4">
        {text ? (
          <p className="text-[14.5px] leading-[1.55] text-ink whitespace-pre-wrap break-words">
            {text}
          </p>
        ) : (
          <p className="text-[14px] text-ink/35 italic">
            Your post will appear here as you type.
          </p>
        )}
      </div>

      <footer className="px-5 py-3 border-t border-border flex items-center justify-between text-ink/45">
        <div className="flex items-center gap-5">
          <IconAction Icon={Heart} />
          <IconAction Icon={MessageSquare} />
          <IconAction Icon={Repeat2} />
          <IconAction Icon={Share} />
        </div>
        <IconAction Icon={Bookmark} />
      </footer>
    </article>
  );
}

function IconAction({
  Icon,
}: {
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      className="inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-muted/60 transition-colors"
    >
      <Icon className="w-[15px] h-[15px]" />
    </button>
  );
}
