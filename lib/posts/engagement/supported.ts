// Platforms with an engagement snapshot fetcher implemented. Used by both
// the sync dispatcher (to decide whether to call) and the publisher (to
// decide whether to schedule snapshot ticks at publish time).
export const SUPPORTED_SNAPSHOT_PLATFORMS = [
  "bluesky",
  "twitter",
  "mastodon",
  "instagram",
  "pinterest",
  "linkedin",
  "threads",
] as const;

export type SnapshotPlatform = (typeof SUPPORTED_SNAPSHOT_PLATFORMS)[number];

export function isSnapshotSupported(
  platform: string,
): platform is SnapshotPlatform {
  return (SUPPORTED_SNAPSHOT_PLATFORMS as readonly string[]).includes(platform);
}
