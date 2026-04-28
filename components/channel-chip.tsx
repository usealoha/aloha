import {
	BlueskyIcon,
	FacebookIcon,
	InstagramIcon,
	LinkedInIcon,
	MastodonIcon,
	MediumIcon,
	PinterestIcon,
	RedditIcon,
	TelegramIcon,
	ThreadsIcon,
	TikTokIcon,
	XIcon,
	YouTubeIcon,
} from "@/app/auth/_components/provider-icons";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

export const CHANNEL_LABELS: Record<string, string> = {
	twitter: "X",
	linkedin: "LinkedIn",
	facebook: "Facebook",
	instagram: "Instagram",
	tiktok: "TikTok",
	threads: "Threads",
	bluesky: "Bluesky",
	medium: "Medium",
	reddit: "Reddit",
	pinterest: "Pinterest",
	mastodon: "Mastodon",
	youtube: "YouTube",
	telegram: "Telegram",
};

export const CHANNEL_ICONS: Record<
	string,
	React.ComponentType<{ className?: string }>
> = {
	twitter: XIcon,
	linkedin: LinkedInIcon,
	facebook: FacebookIcon,
	instagram: InstagramIcon,
	tiktok: TikTokIcon,
	threads: ThreadsIcon,
	bluesky: BlueskyIcon,
	medium: MediumIcon,
	reddit: RedditIcon,
	pinterest: PinterestIcon,
	mastodon: MastodonIcon,
	youtube: YouTubeIcon,
	telegram: TelegramIcon,
};

export function channelLabel(channel: string) {
	return CHANNEL_LABELS[channel] ?? channel;
}

/** Read-only display chip: icon + label. */
export function ChannelChip({
	channel,
	className,
}: {
	channel: string;
	className?: string;
}) {
	const Icon = CHANNEL_ICONS[channel];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 h-5 px-2 rounded-full border border-border text-[10.5px] font-medium tracking-wide text-ink/70",
				className,
			)}
		>
			{Icon ? <Icon className="w-3 h-3" /> : null}
			{channelLabel(channel)}
		</span>
	);
}

/** Toggleable channel chip wrapping a checkbox — selected state flips to ink. */
export function ChannelToggle({
	channel,
	name = "channels",
	defaultChecked = true,
}: {
	channel: string;
	name?: string;
	defaultChecked?: boolean;
}) {
	const Icon = CHANNEL_ICONS[channel];
	return (
		<label className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border bg-background text-[13px] text-ink cursor-pointer has-checked:bg-ink has-checked:text-background has-checked:border-ink">
			<input
				type="checkbox"
				name={name}
				value={channel}
				defaultChecked={defaultChecked}
				className="sr-only"
			/>
			{Icon ? <Icon className="w-3.5 h-3.5" /> : null}
			{channelLabel(channel)}
		</label>
	);
}

const channelIconContainerClasses = cva(
	"inline-flex items-center justify-center rounded-full bg-background-elev border border-border ring-1 ring-background",
	{
		variants: {
			size: {
				sm: "w-5 h-5",
				md: "w-6 h-6",
				lg: "w-7 h-7",
			},
		},
	},
);

const channelIconClasses = cva("text-ink/70", {
	variants: {
		size: {
			sm: "w-2.5 h-2.5",
			md: "w-3 h-3",
			lg: "w-3.5 h-3.5",
		},
	},
});

/** Read-only display chip: icon + label. */
export const ChannelIcons = ({
	channels,
	size,
	visible = 4,
}: {
	channels: Array<string>;
	size: "sm" | "md" | "lg";
	visible?: number;
}) => {
	if (channels.length === 0) {
		return <span className="text-[10.5px] text-ink/45">No channel</span>;
	}

	const visibleChannels = channels.slice(0, visible);
	const overflow = Math.max(0, channels.length - visible);

	return (
		<div className="flex items-center -space-x-1.5">
			{visibleChannels.map((p) => {
				const Icon = CHANNEL_ICONS[p];
				return (
					<span
						key={p}
						aria-label={CHANNEL_LABELS[p] ?? p}
						className={channelIconContainerClasses({ size })}
					>
						{Icon ? <Icon className={channelIconClasses({ size })} /> : null}
					</span>
				);
			})}
			{overflow > 0 ? (
				<span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-muted border border-border ring-1 ring-background text-[9.5px] font-medium text-ink/65 tabular-nums">
					+{overflow}
				</span>
			) : null}
		</div>
	);
};
