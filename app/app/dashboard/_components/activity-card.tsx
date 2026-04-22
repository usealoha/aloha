import { ChannelChip, channelLabel } from "@/components/channel-chip";
import { ArrowUpRight, MessageSquare, MessagesSquare } from "lucide-react";
import Link from "next/link";

export type ActivityItem = {
  id: string;
  kind: "reply" | "mention" | "dm";
  platform: string;
  authorHandle: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  content: string;
  platformCreatedAt: Date;
  href: string;
};

const KIND_ICON = {
  reply: MessageSquare,
  mention: MessagesSquare,
  dm: MessagesSquare,
} as const;

const KIND_LABEL = {
  reply: "replied",
  mention: "mentioned you",
  dm: "sent a DM",
} as const;

function timeAgo(d: Date): string {
  const secs = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return `${Math.floor(days / 30)}mo`;
}

export function ActivityCard({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rounded-2xl border border-border bg-background-elev p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessagesSquare className="w-3.5 h-3.5 text-ink/50" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55">
            Recent activity
          </p>
        </div>
        <Link
          href="/app/inbox"
          className="text-[11px] text-ink/50 hover:text-ink transition-colors inline-flex items-center gap-0.5"
        >
          Inbox
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-[12.5px] text-ink/50 leading-[1.55]">
          No recent replies, mentions, or DMs. Refresh the inbox or open a
          post to pull the latest.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {items.map((item) => {
            const Icon = KIND_ICON[item.kind];
            const name = item.authorDisplayName ?? item.authorHandle;
            return (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={item.href}
                  className="flex items-start gap-3 group"
                >
                  {item.authorAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.authorAvatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-peach-100 border border-border shrink-0 grid place-items-center text-[10.5px] font-medium text-ink/60">
                      {name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[12px] text-ink/65">
                      <span className="font-medium text-ink truncate">
                        {name}
                      </span>
                      <span className="text-ink/45 shrink-0">
                        {KIND_LABEL[item.kind]} on {channelLabel(item.platform)}
                      </span>
                      <span className="ml-auto text-[11px] text-ink/40 shrink-0">
                        {timeAgo(item.platformCreatedAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-ink/70 line-clamp-2 leading-[1.5]">
                      {item.content}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <ChannelChip channel={item.platform} />
                      <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-muted text-[10px] text-ink/55">
                        <Icon className="w-2.5 h-2.5" />
                        {item.kind === "dm" ? "DM" : item.kind}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
