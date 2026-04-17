"use client";

import { AlertCircle, Eye, EyeOff, Loader2, Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { connectMastodon } from "../../actions";

type Props = {
	isConnected: boolean;
	isSoon?: boolean;
	isFormOpen?: boolean;
	onClose?: () => void;
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
				<>
					<Plus className="w-3.5 h-3.5" />
					Connect
				</>
			)}
		</button>
	);
}

export function MastodonChannelItem({
	isConnected,
	isSoon,
	isFormOpen,
	onClose,
}: Props) {
	const [showToken, setShowToken] = useState(false);
	const [state, formAction] = useActionState(connectMastodon, null);

	if (isSoon) {
		return (
			<button
				type="button"
				disabled
				className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-dashed border-border-strong text-[13px] text-ink/45 shrink-0"
			>
				Not available yet
			</button>
		);
	}

	if (!isConnected && !isFormOpen) {
		return (
			<button
				type="button"
				onClick={onClose}
				className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors shrink-0"
			>
				<Plus className="w-3.5 h-3.5" />
				Connect
			</button>
		);
	}

	return (
		<div className="w-full">
			{state?.error && (
				<div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 mb-3">
					<AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
					<p className="text-[13px] font-medium text-red-800">{state.error}</p>
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
							{showToken ? (
								<EyeOff className="w-4 h-4" />
							) : (
								<Eye className="w-4 h-4" />
							)}
						</button>
					</div>
				</div>
				<SubmitButton />
			</form>

			<details className="text-[11.5px] text-ink/50 mt-3">
				<summary className="cursor-pointer hover:text-ink/70">
					How do I get an access token?
				</summary>
				<p className="mt-1.5 pl-2">
					Go to your Mastodon instance settings → Development → New application.
					Check &quot;read&quot; and &quot;write&quot; scopes, then copy the
					access token.
				</p>
			</details>
		</div>
	);
}
