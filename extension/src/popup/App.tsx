import { useCallback, useEffect, useState } from "react";
import { AuthRequiredError, alohaJson } from "./lib/api";
import { SignInPrompt } from "./auth/SignInPrompt";
import { CaptureView } from "./capture/CaptureView";
import { PublishView } from "./publish/PublishView";
import { readActiveSurface, type ActiveSurface } from "./lib/platform";

type WhoAmI = {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  workspace: { id: string; name: string };
  role: string;
};

type State =
  | { kind: "loading" }
  | { kind: "unauth" }
  | { kind: "ready"; me: WhoAmI; surface: ActiveSurface | null }
  | { kind: "error"; message: string };

export function App() {
  const [state, setState] = useState<State>({ kind: "loading" });

  const probe = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [me, surface] = await Promise.all([
        alohaJson<WhoAmI>("/api/whoami"),
        readActiveSurface(),
      ]);
      setState({ kind: "ready", me, surface });
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        setState({ kind: "unauth" });
        return;
      }
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Couldn't reach Aloha.",
      });
    }
  }, []);

  useEffect(() => {
    void probe();
  }, [probe]);

  if (state.kind === "loading") {
    return (
      <div className="min-h-[320px] grid place-items-center text-[13px] text-ink-soft">
        Connecting to Aloha…
      </div>
    );
  }

  if (state.kind === "unauth") {
    return <SignInPrompt onRetry={probe} />;
  }

  if (state.kind === "error") {
    return (
      <div className="min-h-[320px] flex flex-col items-center justify-center px-6 py-8 text-center gap-3">
        <p className="text-[14px] text-ink leading-[1.4]">
          Couldn&apos;t reach Aloha.
        </p>
        <p className="text-[12px] text-ink-soft leading-[1.55]">
          {state.message}
        </p>
        <button
          type="button"
          onClick={probe}
          className="mt-2 h-9 px-4 rounded-full border border-border text-[12.5px] font-medium hover:border-ink transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // Authed — pick capture vs publish based on the active tab. Publish
  // surfaces (LinkedIn / Instagram / TikTok / Medium compose pages)
  // take precedence; everywhere else we default to capture.
  if (state.surface?.mode === "publish") {
    return (
      <PublishView
        workspaceName={state.me.workspace.name}
        platform={state.surface.platform}
        tabId={state.surface.tabId}
      />
    );
  }
  return <CaptureView workspaceName={state.me.workspace.name} />;
}
