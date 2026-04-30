import { cache } from "react";
import { and, eq, notInArray } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  blueskyCredentials,
  mastodonCredentials,
  telegramCredentials,
} from "@/db/schema";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";

// Connected-channels snapshot. A workspace's "connected channels" live across
// four tables: OAuth `accounts` (filtered to drop `google`/`github`, which are
// auth-only), plus the per-channel credential tables for bluesky / mastodon /
// telegram. Forgetting any of those tables silently misreports the workspace
// as having no channels, which has bitten the composer, channel-state, inbox,
// and a handful of dashboards.
//
// One snapshot covers every shape the call sites need:
//   - distinct provider list  (composer, posts list, campaigns, analytics)
//   - membership set          (inbox dispatch, channel-state)
//   - distinct provider count (dashboard "channels" tile)
//   - per-account count       (billing entitlement: 2 LinkedIn accounts = 2)
//   - individual booleans     (dashboard mini-tiles, settings refresh)
//
// Wrapped in React `cache()` so a single render that hits this from multiple
// RSCs (page + nested layouts) only runs the four queries once.

export type ConnectedChannelsSnapshot = {
  /** Distinct provider ids, sorted for stable output. */
  providers: readonly string[];
  /** Same set as `providers`, ready for `.has()` lookups. */
  providerSet: ReadonlySet<string>;
  /** OAuth account rows, with duplicates (one workspace can hold N LinkedIn accounts). */
  oauthAccountCount: number;
  /**
   * Billing-style channel count: every OAuth account row + 1 per non-OAuth
   * provider that has credentials. Used for seat / entitlement math.
   */
  perAccountCount: number;
  hasBluesky: boolean;
  hasMastodon: boolean;
  hasTelegram: boolean;
};

async function loadConnectedChannels(
  workspaceId: string,
): Promise<ConnectedChannelsSnapshot> {
  const [oauthRows, blueskyRows, mastodonRows, telegramRows] = await Promise.all([
    db
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(
        and(
          eq(accounts.workspaceId, workspaceId),
          notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
        ),
      ),
    db
      .select({ id: blueskyCredentials.id })
      .from(blueskyCredentials)
      .where(eq(blueskyCredentials.workspaceId, workspaceId))
      .limit(1),
    db
      .select({ id: mastodonCredentials.id })
      .from(mastodonCredentials)
      .where(eq(mastodonCredentials.workspaceId, workspaceId))
      .limit(1),
    db
      .select({ id: telegramCredentials.id })
      .from(telegramCredentials)
      .where(eq(telegramCredentials.workspaceId, workspaceId))
      .limit(1),
  ]);

  const hasBluesky = blueskyRows.length > 0;
  const hasMastodon = mastodonRows.length > 0;
  const hasTelegram = telegramRows.length > 0;

  const providerSet = new Set<string>(oauthRows.map((r) => r.provider));
  if (hasBluesky) providerSet.add("bluesky");
  if (hasMastodon) providerSet.add("mastodon");
  if (hasTelegram) providerSet.add("telegram");

  const providers = Array.from(providerSet).sort();

  return {
    providers,
    providerSet,
    oauthAccountCount: oauthRows.length,
    perAccountCount:
      oauthRows.length +
      (hasBluesky ? 1 : 0) +
      (hasMastodon ? 1 : 0) +
      (hasTelegram ? 1 : 0),
    hasBluesky,
    hasMastodon,
    hasTelegram,
  };
}

/**
 * Single source of truth for "what channels does this workspace have
 * connected". Prefer this over hand-rolled credential-table joins so the
 * answer can't drift between the composer, dashboard, billing, and inbox.
 */
export const getConnectedChannels = cache(loadConnectedChannels);

/** Convenience wrapper — most call sites only need the provider id list. */
export async function getConnectedProviders(
  workspaceId: string,
): Promise<readonly string[]> {
  const snap = await getConnectedChannels(workspaceId);
  return snap.providers;
}
