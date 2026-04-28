import { useCallback, useEffect, useState } from "react";
import { alohaJson, alohaUrl } from "../lib/api";
import type { PublishPlatform } from "../lib/platform";
import type { PostMedia } from "@aloha/db/schema";
import type {
  IsComposeActiveResponse,
  PrefillRequest,
  PrefillResponse,
} from "../../shared/messages";

type Draft = {
  postId: string;
  deliveryId: string;
  platform: string;
  content: string;
  media: PostMedia[];
  scheduledAt: string | null;
  status: "approved" | "scheduled";
};

type Phase =
  | { kind: "loading" }
  | { kind: "no-editor"; drafts: Draft[] }
  | { kind: "ready"; drafts: Draft[] }
  | { kind: "empty" }
  | { kind: "error"; message: string };

const PLATFORM_LABEL: Record<PublishPlatform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  tiktok: "TikTok",
  medium: "Medium",
};

export function PublishView({
  workspaceName,
  platform,
  tabId,
}: {
  workspaceName: string;
  platform: PublishPlatform;
  tabId: number;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [pending, setPending] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setPhase({ kind: "loading" });
    try {
      // Probe the active tab's content script to confirm it found the
      // compose surface. If nothing matched, we still load drafts but
      // render a hint that prefilling won't work yet.
      let composeActive = false;
      try {
        const resp = (await chrome.tabs.sendMessage(tabId, {
          kind: "aloha:is-compose-active",
        })) as IsComposeActiveResponse | undefined;
        composeActive = Boolean(resp?.active);
      } catch {
        // Content script not loaded (just navigated, or page blocks
        // injection). Treat as no-editor.
      }

      const json = await alohaJson<{ drafts: Draft[] }>(
        `/api/posts/manual-assist?platform=${encodeURIComponent(platform)}`,
      );
      const drafts = json.drafts.filter((d) => !completed.includes(d.deliveryId));
      if (drafts.length === 0) {
        setPhase({ kind: "empty" });
        return;
      }
      setPhase(
        composeActive
          ? { kind: "ready", drafts }
          : { kind: "no-editor", drafts },
      );
    } catch (err) {
      setPhase({
        kind: "error",
        message: err instanceof Error ? err.message : "Couldn't load drafts.",
      });
    }
  }, [completed, platform, tabId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Listen for submit reports broadcast by the content script — when
  // the user actually posts, the popup updates its list without a
  // round-trip refetch.
  useEffect(() => {
    const handler = (msg: unknown) => {
      if (
        msg &&
        typeof msg === "object" &&
        "kind" in msg &&
        (msg as { kind: string }).kind === "aloha:submitted"
      ) {
        const m = msg as unknown as { deliveryId: string };
        setCompleted((prev) =>
          prev.includes(m.deliveryId) ? prev : [...prev, m.deliveryId],
        );
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  // Manual override: user posted on the platform but the extension
  // either wasn't installed at the time or its submit-detection
  // missed. Calls the same complete endpoint the content script
  // would call after observing a real submit.
  const markPosted = async (draft: Draft) => {
    setPending(draft.deliveryId);
    try {
      await alohaJson(
        `/api/posts/${encodeURIComponent(draft.postId)}/deliveries/${encodeURIComponent(draft.platform)}/complete`,
        { method: "PATCH" },
      );
      setCompleted((prev) =>
        prev.includes(draft.deliveryId) ? prev : [...prev, draft.deliveryId],
      );
    } catch (err) {
      setPhase({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Couldn't mark posted.",
      });
    } finally {
      setPending(null);
    }
  };

  const sendPrefill = async (draft: Draft) => {
    setPending(draft.deliveryId);
    try {
      const message: PrefillRequest = {
        kind: "aloha:prefill",
        postId: draft.postId,
        deliveryId: draft.deliveryId,
        platform: draft.platform,
        content: draft.content,
        media: draft.media,
      };
      const resp = (await chrome.tabs.sendMessage(
        tabId,
        message,
      )) as PrefillResponse | undefined;
      if (!resp || !resp.ok) {
        // Content script reported failure; it already toasted the user.
        return;
      }
      // Success — close the popup so the user's full attention is on
      // the platform composer. Their next interaction is review +
      // submit, neither of which need our UI.
      window.close();
    } catch (err) {
      setPhase({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Couldn't reach the page.",
      });
    } finally {
      setPending(null);
    }
  };

  const openPosts = async () => {
    const url = await alohaUrl("/app/posts");
    chrome.tabs.create({ url });
  };

  return (
    <div className="min-h-[320px] flex flex-col px-4 py-4 gap-3">
      <header className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
          Publish · {PLATFORM_LABEL[platform]}
        </p>
        <span className="inline-flex items-center h-5 px-2 rounded-full bg-peach-100 border border-peach-300 text-[10px] tracking-wide text-ink/80">
          {workspaceName}
        </span>
      </header>

      {phase.kind === "loading" ? (
        <p className="text-[12.5px] text-ink-soft">Looking for drafts…</p>
      ) : null}

      {phase.kind === "error" ? (
        <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 leading-[1.5]">
          {phase.message}
        </div>
      ) : null}

      {phase.kind === "empty" ? (
        <div className="rounded-xl border border-dashed border-border bg-background-elev px-3 py-6 text-center">
          <p className="text-[13px] text-ink leading-[1.45]">
            No drafts ready for {PLATFORM_LABEL[platform]}.
          </p>
          <p className="mt-1 text-[11.5px] text-ink-soft leading-[1.55]">
            Approve or schedule a draft in Aloha with{" "}
            {PLATFORM_LABEL[platform]} as a manual-assist channel and it
            will show up here.
          </p>
          <button
            type="button"
            onClick={openPosts}
            className="mt-3 inline-flex items-center justify-center h-8 px-3 rounded-full border border-border text-[11.5px] font-medium hover:border-ink transition-colors"
          >
            Open Aloha
          </button>
        </div>
      ) : null}

      {phase.kind === "no-editor" ? (
        <div className="rounded-xl border border-peach-300 bg-peach-100/40 px-3 py-2 text-[11.5px] text-ink leading-[1.5]">
          Click {PLATFORM_LABEL[platform]}&apos;s &quot;Start a post&quot;
          (or equivalent) so the composer is open, then come back here
          and pick a draft.
        </div>
      ) : null}

      {(phase.kind === "ready" || phase.kind === "no-editor") &&
      phase.drafts.length > 0 ? (
        <ul className="space-y-1.5 overflow-y-auto max-h-[400px]">
          {phase.drafts.map((draft) => (
            <li
              key={draft.deliveryId}
              className="rounded-xl border border-border bg-background-elev px-3 py-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] uppercase tracking-[0.18em] text-ink-soft">
                  {draft.status}
                  {draft.scheduledAt
                    ? ` · ${new Date(draft.scheduledAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
                    : ""}
                </span>
                {draft.media.length > 0 ? (
                  <span className="inline-flex items-center h-5 px-2 rounded-full bg-background border border-border text-[10px] text-ink-soft">
                    {draft.media.length} media
                  </span>
                ) : null}
              </div>
              <p className="text-[12px] text-ink leading-[1.5] whitespace-pre-wrap line-clamp-4">
                {draft.content}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => sendPrefill(draft)}
                  disabled={pending === draft.deliveryId || phase.kind === "no-editor"}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-ink text-background text-[11.5px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
                >
                  {pending === draft.deliveryId ? "Filling…" : "Use this"}
                </button>
                <button
                  type="button"
                  onClick={() => markPosted(draft)}
                  disabled={pending === draft.deliveryId}
                  title={`If you've already posted this on ${PLATFORM_LABEL[platform]}, mark the delivery as done.`}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-full border border-border text-[11px] font-medium text-ink/75 hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
                >
                  Already posted
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-[11px] text-ink-soft">
        <button
          type="button"
          onClick={refresh}
          className="hover:text-ink transition-colors"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={openPosts}
          className="hover:text-ink transition-colors"
        >
          Open Aloha
        </button>
      </div>
    </div>
  );
}
