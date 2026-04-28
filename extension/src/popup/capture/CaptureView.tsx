import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { alohaFetch, alohaJson, alohaUrl } from "../lib/api";
import {
  CAPTURE_PLATFORMS,
  DEFAULT_TARGETS,
  type CapturePlatform,
} from "../lib/channels";
import {
  readImportStream,
  type ImportEvent,
} from "../lib/import-stream";
import { getLastTargets, saveLastTargets } from "../lib/preferences";
import { readActiveTab, type TabSnapshot } from "../lib/tab";

type EntryState = "idle" | "streaming" | "done" | "error";
type Entry = {
  text: string;
  state: EntryState;
  saved?: boolean;
  errorMessage?: string;
};

type Phase = "idle" | "streaming" | "all_done" | "fatal";

export function CaptureView({ workspaceName }: { workspaceName: string }) {
  const [tab, setTab] = useState<TabSnapshot | null>(null);
  const [tabError, setTabError] = useState<string | null>(null);
  const [targets, setTargets] = useState<string[]>([...DEFAULT_TARGETS]);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [fatal, setFatal] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // Bootstrap: read the current tab + last-used targets in parallel.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [snapshot, lastTargets] = await Promise.all([
          readActiveTab(),
          getLastTargets(),
        ]);
        if (cancelled) return;
        if (!snapshot) {
          setTabError("Couldn't read the active tab.");
          return;
        }
        setTab(snapshot);
        if (lastTargets.length > 0) {
          // Validate against the curated list so a stale stored entry
          // (e.g., a platform we removed) doesn't show up checked.
          const valid = lastTargets.filter((t) =>
            CAPTURE_PLATFORMS.some((p) => p.id === t),
          );
          if (valid.length > 0) setTargets(valid);
        }
      } catch (err) {
        if (cancelled) return;
        setTabError(err instanceof Error ? err.message : "Couldn't read tab.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canRun =
    tab !== null &&
    !tab.unsupportedReason &&
    targets.length > 0 &&
    phase !== "streaming";

  const toggleTarget = (id: string) => {
    setTargets((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const run = useCallback(async () => {
    if (!tab || !canRun) return;
    void saveLastTargets(targets);
    setFatal(null);
    setSavedCount(0);
    setEntries(
      Object.fromEntries(
        targets.map((id) => [id, { text: "", state: "idle" as EntryState }]),
      ),
    );
    setPhase("streaming");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = await alohaUrl("/api/ai/import");
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Aloha-Extension": "1",
        },
        body: JSON.stringify({
          kind: "url",
          url: tab.url,
          targetPlatforms: targets,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Sign in to Aloha — your session expired.");
        }
        if (res.status === 402) {
          const text = await res.text().catch(() => "");
          throw new Error(text || "Muse usage cap hit for this period.");
        }
        if (res.status === 403) {
          throw new Error("Capture needs a Muse subscription.");
        }
        throw new Error(`Import failed (${res.status}).`);
      }

      for await (const ev of readImportStream(res)) {
        applyEvent(ev);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setFatal(err instanceof Error ? err.message : "Capture failed.");
      setPhase("fatal");
    } finally {
      abortRef.current = null;
      setPhase((p) => (p === "streaming" ? "all_done" : p));
    }
  }, [canRun, tab, targets]);

  const applyEvent = (ev: ImportEvent) => {
    if (ev.type === "fatal") {
      setFatal(ev.message);
      setPhase("fatal");
      return;
    }
    if (ev.type === "extracted" || ev.type === "all_done") {
      if (ev.type === "all_done") setPhase("all_done");
      return;
    }
    if (!("platform" in ev)) return;
    setEntries((prev) => {
      const cur = prev[ev.platform] ?? { text: "", state: "idle" as EntryState };
      if (ev.type === "start") {
        return {
          ...prev,
          [ev.platform]: { ...cur, state: "streaming", text: "" },
        };
      }
      if (ev.type === "chunk") {
        return {
          ...prev,
          [ev.platform]: {
            ...cur,
            state: "streaming",
            text: cur.text + ev.text,
          },
        };
      }
      if (ev.type === "done") {
        return {
          ...prev,
          [ev.platform]: { ...cur, state: "done", text: ev.text },
        };
      }
      if (ev.type === "error") {
        return {
          ...prev,
          [ev.platform]: {
            ...cur,
            state: "error",
            errorMessage: ev.message,
          },
        };
      }
      return prev;
    });
  };

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
  };

  const saveOne = async (platformId: string) => {
    const entry = entries[platformId];
    if (!entry || entry.state !== "done" || !entry.text) return;
    try {
      await alohaJson<{ ok: true; postId: string }>("/api/posts/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: entry.text,
          platforms: [platformId],
        }),
      });
      setEntries((prev) => ({
        ...prev,
        [platformId]: { ...prev[platformId]!, saved: true },
      }));
      setSavedCount((c) => c + 1);
    } catch (err) {
      setEntries((prev) => ({
        ...prev,
        [platformId]: {
          ...prev[platformId]!,
          errorMessage:
            err instanceof Error ? err.message : "Couldn't save.",
        },
      }));
    }
  };

  const saveAll = async () => {
    const ids = Object.entries(entries)
      .filter(([, e]) => e.state === "done" && !e.saved)
      .map(([id]) => id);
    for (const id of ids) {
      // Sequential so a 429/rate-limit on the API doesn't pile up.
      // The drafts endpoint is cheap; this is fine UX-wise for ≤10 ids.
      await saveOne(id);
    }
  };

  const openPosts = async () => {
    const url = await alohaUrl("/app/posts");
    chrome.tabs.create({ url });
  };

  const platformsById = useMemo(() => {
    const map = new Map<string, CapturePlatform>();
    for (const p of CAPTURE_PLATFORMS) map.set(p.id, p);
    return map;
  }, []);

  if (tabError) {
    return (
      <Wrap workspaceName={workspaceName}>
        <p className="text-[13px] text-ink/80 leading-[1.5]">{tabError}</p>
      </Wrap>
    );
  }

  if (!tab) {
    return (
      <Wrap workspaceName={workspaceName}>
        <p className="text-[12.5px] text-ink-soft">Reading the page…</p>
      </Wrap>
    );
  }

  if (tab.unsupportedReason) {
    return (
      <Wrap workspaceName={workspaceName}>
        <p className="text-[13px] text-ink leading-[1.5]">
          {tab.unsupportedReason}
        </p>
        <p className="mt-2 text-[12px] text-ink-soft leading-[1.55]">
          Open a regular web page (article, post, doc) and try again.
        </p>
      </Wrap>
    );
  }

  return (
    <Wrap workspaceName={workspaceName}>
      <header className="space-y-1.5">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
          Capture
        </p>
        <p className="text-[13.5px] text-ink leading-[1.45] truncate" title={tab.title ?? tab.url}>
          {tab.title ?? hostnameOf(tab.url)}
        </p>
        <p className="text-[11.5px] text-ink-soft truncate" title={tab.url}>
          {hostnameOf(tab.url)}
          {tab.selection ? " · selection captured" : ""}
        </p>
      </header>

      <fieldset
        disabled={phase === "streaming"}
        className="grid grid-cols-2 gap-1.5"
      >
        {CAPTURE_PLATFORMS.map((p) => {
          const checked = targets.includes(p.id);
          return (
            <label
              key={p.id}
              className={
                "flex items-start gap-2 px-2.5 py-1.5 rounded-xl border cursor-pointer transition-colors text-[12px] " +
                (checked
                  ? "border-ink bg-peach-100/50 text-ink"
                  : "border-border bg-background text-ink/75 hover:border-ink/40")
              }
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleTarget(p.id)}
                className="mt-0.5"
              />
              <span className="flex-1 min-w-0">
                <span className="block font-medium">{p.name}</span>
                <span className="block text-[10.5px] text-ink-soft">
                  {p.blurb}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex items-center gap-2">
        {phase === "streaming" ? (
          <button
            type="button"
            onClick={cancel}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full border border-border-strong text-[12.5px] font-medium hover:border-ink transition-colors"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={run}
            disabled={!canRun}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
          >
            {phase === "all_done" || phase === "fatal"
              ? "Re-run"
              : "Generate drafts"}
          </button>
        )}
      </div>

      {fatal ? (
        <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {fatal}
        </p>
      ) : null}

      {Object.keys(entries).length > 0 ? (
        <ul className="space-y-1.5">
          {targets.map((id) => {
            const entry = entries[id];
            const platform = platformsById.get(id);
            if (!entry || !platform) return null;
            return (
              <li
                key={id}
                className="rounded-xl border border-border bg-background-elev px-3 py-2.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium text-ink">
                    {platform.name}
                  </span>
                  <Chip entry={entry} />
                </div>
                <p className="text-[11.5px] text-ink/80 leading-[1.5] whitespace-pre-wrap line-clamp-4">
                  {entry.text ||
                    (entry.state === "streaming"
                      ? "Drafting…"
                      : entry.state === "error"
                        ? entry.errorMessage ?? "Error"
                        : "Waiting…")}
                </p>
                {entry.state === "done" && !entry.saved ? (
                  <button
                    type="button"
                    onClick={() => saveOne(id)}
                    className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-ink text-background text-[11px] font-medium hover:bg-primary transition-colors"
                  >
                    Save as draft
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {savedCount > 0 ? (
        <div className="rounded-xl border border-peach-300 bg-peach-100/50 px-3 py-2 flex items-center justify-between gap-2">
          <p className="text-[12px] text-ink leading-[1.4]">
            {savedCount === 1
              ? "Saved 1 draft to Aloha."
              : `Saved ${savedCount} drafts to Aloha.`}
          </p>
          <button
            type="button"
            onClick={openPosts}
            className="inline-flex items-center h-7 px-3 rounded-full text-[11px] font-medium text-ink hover:bg-peach-100 transition-colors"
          >
            Open
          </button>
        </div>
      ) : null}

      {phase === "all_done" &&
      Object.values(entries).some(
        (e) => e.state === "done" && !e.saved,
      ) ? (
        <button
          type="button"
          onClick={saveAll}
          className="inline-flex items-center justify-center h-9 px-4 rounded-full border border-border text-[12px] font-medium hover:border-ink transition-colors"
        >
          Save all to drafts
        </button>
      ) : null}
    </Wrap>
  );
}

function Chip({ entry }: { entry: Entry }) {
  if (entry.saved) {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full bg-ink text-background text-[10px] tracking-wide">
        Saved
      </span>
    );
  }
  if (entry.state === "streaming") {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full bg-peach-100 border border-peach-300 text-[10px] text-ink/70">
        Drafting
      </span>
    );
  }
  if (entry.state === "done") {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full bg-background border border-border text-[10px] text-ink-soft">
        Ready
      </span>
    );
  }
  if (entry.state === "error") {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full bg-red-50 border border-red-200 text-[10px] text-red-700">
        Error
      </span>
    );
  }
  return null;
}

function Wrap({
  workspaceName,
  children,
}: {
  workspaceName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[320px] flex flex-col px-4 py-4 gap-3">
      <header className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
          Aloha
        </p>
        <span className="inline-flex items-center h-5 px-2 rounded-full bg-peach-100 border border-peach-300 text-[10px] tracking-wide text-ink/80">
          {workspaceName}
        </span>
      </header>
      {children}
    </div>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
