// Single source of truth for channel availability across UI surfaces.
// The publish pipeline already keys off `PLATFORM_GATING` (in
// `lib/channel-state.ts`); this module mirrors that into the
// settings-page vocabulary so any flip to a channel's status is a
// one-line change in `PLATFORM_GATING`.
//
// Adding a new "soon" tier here (channels we want to show as coming-soon
// in the UI before the publisher even exists) doesn't need to touch
// PLATFORM_GATING — list them in `SOON_CHANNELS` and they'll render with
// the dashed-border "Soon" treatment.

import { PLATFORM_GATING } from "@/lib/channel-state";

export type ChannelAvailability = "available" | "approval_needed" | "soon";

// Channels we explicitly want shown as coming-soon. None today — left
// here so the pattern is obvious when we want to seed marketing buzz
// for a channel before its publisher lands.
const SOON_CHANNELS: ReadonlySet<string> = new Set();

// Resolves a channel id to its UI availability bucket. Defaults to
// "available" when a channel isn't listed in either PLATFORM_GATING or
// SOON_CHANNELS — this matches the prior fallback behavior in
// `loadChannelState` and keeps Telegram (which has no platform-review
// gate) rendering as available without an explicit entry.
export function channelAvailability(channelId: string): ChannelAvailability {
  if (SOON_CHANNELS.has(channelId)) return "soon";
  const gating = PLATFORM_GATING[channelId];
  if (gating === "pending_approval") return "approval_needed";
  return "available";
}
