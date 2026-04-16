"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2, AlertCircle, Trash2, ShieldCheck } from "lucide-react";
import { connectMastodon, disconnectMastodon } from "../../actions";
import { MastodonIcon } from "@/app/auth/_components/provider-icons";

type Props = {
  isConnected: boolean;
  instanceUrl?: string | null;
  username?: string | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Connecting...
        </>
      ) : (
        "Connect"
      )}
    </button>
  );
}

export function MastodonChannelItem({ isConnected, instanceUrl, username }: Props) {
  const [showToken, setShowToken] = useState(false);
  const [showForm, setShowForm] = useState(!isConnected);
  const [state, formAction] = useActionState(connectMastodon, null);
  const [disconnecting, setDisconnecting] = useState(false);

  const disconnectAction = async () => {
    setDisconnecting(true);
    await disconnectMastodon();
  };

  if (isConnected && !showForm) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ink text-background text-[10.5px] font-medium tracking-wide">
              <ShieldCheck className="w-3 h-3" />
              Connected
            </span>
          </div>
          <p className="mt-1 text-[12.5px] text-ink/60">
            {instanceUrl} · @{username}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-deep transition-colors"
        >
          Reconnect
        </button>
        <button
          type="button"
          disabled={disconnecting}
          onClick={disconnectAction}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-primary-deep hover:bg-peach-100/60 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {state?.error && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-[13px] font-medium text-red-800">
            {state.error}
          </p>
        </div>
      )}

      <form action={formAction} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-1">
          <input
            id="instanceUrl"
            name="instanceUrl"
            type="url"
            placeholder="mastodon.social"
            required
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
        <div className="flex-1 space-y-1">
          <div className="relative">
            <input
              id="accessToken"
              name="accessToken"
              type={showToken ? "text" : "password"}
              placeholder="Access token"
              required
              className="w-full h-10 px-3 pr-10 rounded-xl border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <SubmitButton />
      </form>

      <details className="text-[11.5px] text-ink/50">
        <summary className="cursor-pointer hover:text-ink/70">How do I get an access token?</summary>
        <p className="mt-1.5 pl-2">
          Go to your Mastodon instance settings → Development → New application.
          Check &quot;read&quot; and &quot;write&quot; scopes, then copy the access token.
        </p>
      </details>
    </div>
  );
}