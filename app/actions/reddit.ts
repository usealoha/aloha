"use server";

import { getFreshToken } from "@/lib/publishers/tokens";
import { assertRole } from "@/lib/workspaces/assert-role";
import { ROLES } from "@/lib/workspaces/roles";

export type RedditFlair = {
  id: string;
  text: string;
  textEditable: boolean;
};

// List link flairs for a subreddit. Reddit requires a fresh OAuth token
// because flair endpoints aren't public for restricted subreddits. The
// editor calls this when the user types a subreddit so the dropdown can
// fill in. Errors return an empty array — callers fall back to free-text.
export async function listSubredditFlairs(
  subreddit: string,
): Promise<RedditFlair[]> {
  const ctx = await assertRole(ROLES.EDITOR);
  if (!subreddit) return [];
  try {
    const account = await getFreshToken(ctx.workspace.id, "reddit");
    const res = await fetch(
      `https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/api/link_flair_v2`,
      { headers: { Authorization: `Bearer ${account.accessToken}` } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as Array<{
      id: string;
      text: string;
      text_editable?: boolean;
    }>;
    if (!Array.isArray(json)) return [];
    return json.map((f) => ({
      id: f.id,
      text: f.text,
      textEditable: f.text_editable === true,
    }));
  } catch {
    return [];
  }
}
