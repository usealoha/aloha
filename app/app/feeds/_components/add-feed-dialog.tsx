"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Tabs } from "@base-ui/react/tabs";
import {
  Check,
  Loader2,
  Plus,
  Rss,
  X as XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { subscribeToFeed } from "@/app/actions/feeds";
import {
  CURATED_CATEGORIES,
  CURATED_FEEDS,
  type CuratedCategory,
  type CuratedFeed,
} from "@/lib/feeds/curated";
import { cn } from "@/lib/utils";

type RowState = "idle" | "loading" | "subscribed" | "error";

export function AddFeedDialog({
  subscribedUrls,
}: {
  subscribedUrls: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<CuratedCategory | "custom">(
    CURATED_CATEGORIES[0],
  );

  // Per-feed UI state keyed by URL. Starts from current subscriptions so
  // feeds already in the user's list render as "Subscribed" immediately.
  const initial = useMemo<Record<string, RowState>>(() => {
    const m: Record<string, RowState> = {};
    for (const u of subscribedUrls) m[u] = "subscribed";
    return m;
  }, [subscribedUrls]);
  const [rowState, setRowState] =
    useState<Record<string, RowState>>(initial);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  // Custom URL tab
  const [customUrl, setCustomUrl] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [customSuccess, setCustomSuccess] = useState<string | null>(null);
  const [isCustomPending, startCustom] = useTransition();

  const catalog = useMemo(() => {
    const out = {} as Record<CuratedCategory, CuratedFeed[]>;
    for (const c of CURATED_CATEGORIES) out[c] = [];
    for (const f of CURATED_FEEDS) {
      const cat = f.category as CuratedCategory;
      (out[cat] ??= []).push(f);
    }
    return out;
  }, []);

  const reset = () => {
    setRowState(initial);
    setRowError({});
    setCustomUrl("");
    setCustomError(null);
    setCustomSuccess(null);
    setTab(CURATED_CATEGORIES[0]);
  };

  const handleSubscribe = (url: string, category?: string | null) => {
    setRowState((prev) => ({ ...prev, [url]: "loading" }));
    setRowError((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
    (async () => {
      const res = await subscribeToFeed(url, category ?? null);
      if (res.ok) {
        setRowState((prev) => ({ ...prev, [url]: "subscribed" }));
        router.refresh();
      } else {
        setRowState((prev) => ({ ...prev, [url]: "error" }));
        setRowError((prev) => ({ ...prev, [url]: res.error }));
      }
    })();
  };

  const handleCustomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = customUrl.trim();
    if (!url) return;
    setCustomError(null);
    setCustomSuccess(null);
    startCustom(async () => {
      const res = await subscribeToFeed(url);
      if (res.ok) {
        setCustomSuccess(
          res.itemsAdded > 0
            ? `Imported ${res.title} — ${res.itemsAdded} items.`
            : `Subscribed to ${res.title}.`,
        );
        setCustomUrl("");
        router.refresh();
      } else {
        setCustomError(res.error);
      }
    });
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Dialog.Trigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add feed
          </button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(820px,calc(100vw-2rem))] max-h-[min(720px,calc(100vh-2rem))] -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-3xl border border-border bg-background-elev shadow-xl outline-none data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95 transition-[opacity,transform] duration-200">
          <header className="flex items-start gap-3 p-6 pb-4">
            <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
              <Rss className="w-4 h-4 text-ink" />
            </span>
            <div className="flex-1">
              <Dialog.Title className="text-[15px] text-ink font-medium">
                Add a feed
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[12.5px] text-ink/60 leading-[1.5]">
                Pick from the catalog, or paste any RSS / Atom URL. We&apos;ll
                fetch, parse, and import items immediately.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink/50 hover:text-ink hover:bg-muted/60 transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-4 h-4" />
            </Dialog.Close>
          </header>

          <Tabs.Root
            value={tab}
            onValueChange={(v) => setTab(v as CuratedCategory | "custom")}
            className="flex flex-col min-h-0 flex-1"
          >
            <Tabs.List className="flex items-center gap-1 px-6 pb-3 overflow-x-auto">
              {CURATED_CATEGORIES.map((c) => (
                <Tabs.Tab
                  key={c}
                  value={c}
                  className="inline-flex items-center h-8 px-3 rounded-full text-[12.5px] font-medium text-ink/70 hover:text-ink hover:bg-muted/60 data-[selected]:bg-ink data-[selected]:text-background transition-colors whitespace-nowrap cursor-pointer outline-none"
                >
                  {c}
                </Tabs.Tab>
              ))}
              <span className="mx-2 h-5 w-px bg-border shrink-0" />
              <Tabs.Tab
                value="custom"
                className="inline-flex items-center h-8 px-3 rounded-full text-[12.5px] font-medium text-ink/70 hover:text-ink hover:bg-muted/60 data-[selected]:bg-ink data-[selected]:text-background transition-colors whitespace-nowrap cursor-pointer outline-none"
              >
                Custom URL
              </Tabs.Tab>
            </Tabs.List>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              {CURATED_CATEGORIES.map((c) => (
                <Tabs.Panel key={c} value={c} className="outline-none">
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {catalog[c].map((feed) => (
                      <FeedRow
                        key={feed.url}
                        feed={feed}
                        state={rowState[feed.url] ?? "idle"}
                        error={rowError[feed.url]}
                        onSubscribe={() =>
                          handleSubscribe(feed.url, feed.category)
                        }
                      />
                    ))}
                  </ul>
                </Tabs.Panel>
              ))}

              <Tabs.Panel value="custom" className="outline-none">
                <form onSubmit={handleCustomSubmit} className="space-y-3">
                  <label className="block text-[12.5px] font-medium text-ink/80">
                    Feed or site URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      required
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://example.com/feed.xml"
                      className="flex-1 h-11 px-4 rounded-full border border-border-strong bg-background text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
                    />
                    <button
                      type="submit"
                      disabled={isCustomPending || !customUrl.trim()}
                      className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCustomPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importing…
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Import
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[12px] text-ink/55 leading-[1.5]">
                    We fetch the URL, parse RSS or Atom, and pull in the latest
                    items. This can take 5–15 seconds for slow publishers.
                  </p>
                  {customError ? (
                    <p className="text-[12.5px] text-primary-deep">
                      {customError}
                    </p>
                  ) : null}
                  {customSuccess ? (
                    <p className="inline-flex items-center gap-1.5 text-[12.5px] text-ink">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      {customSuccess}
                    </p>
                  ) : null}
                </form>
              </Tabs.Panel>
            </div>
          </Tabs.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FeedRow({
  feed,
  state,
  error,
  onSubscribe,
}: {
  feed: CuratedFeed;
  state: RowState;
  error?: string;
  onSubscribe: () => void;
}) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-background p-4">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-ink font-medium truncate">
          {feed.title}
        </p>
        <p className="mt-0.5 text-[11.5px] text-ink/55 leading-[1.45] line-clamp-2">
          {feed.description}
        </p>
        {state === "error" && error ? (
          <p className="mt-1 text-[11.5px] text-primary-deep line-clamp-2">
            {error}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onSubscribe}
        disabled={state === "loading" || state === "subscribed"}
        className={cn(
          "inline-flex items-center gap-1 h-8 px-3 rounded-full text-[11.5px] font-medium transition-colors shrink-0 min-w-[92px] justify-center",
          state === "subscribed"
            ? "bg-ink text-background cursor-default"
            : state === "loading"
              ? "bg-muted text-ink/70 cursor-wait"
              : state === "error"
                ? "border border-primary-deep/50 text-primary-deep hover:bg-peach-100/60"
                : "border border-border-strong text-ink hover:border-ink",
        )}
      >
        {state === "loading" ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Adding…
          </>
        ) : state === "subscribed" ? (
          <>
            <Check className="w-3 h-3" />
            Subscribed
          </>
        ) : state === "error" ? (
          "Retry"
        ) : (
          "Subscribe"
        )}
      </button>
    </li>
  );
}
