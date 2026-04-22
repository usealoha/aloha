"use client";

import { AlertCircle, Eye, EyeOff, Loader2, Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { connectBluesky } from "../../actions";

type Props = {
	isConnected: boolean;
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

export function BlueskyChannelItem({ isConnected }: Props) {
	const [showPassword, setShowPassword] = useState(false);
	const [state, formAction] = useActionState(connectBluesky, null);

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
					<label htmlFor="handle" className="text-[12px] font-medium text-ink/70">
						Bluesky handle
					</label>
					<input
						id="handle"
						name="handle"
						type="text"
						autoComplete="username"
						placeholder="yourname.bsky.social"
						required
						className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
					/>
				</div>
				<div className="flex-1 space-y-1">
					<label htmlFor="appPassword" className="text-[12px] font-medium text-ink/70">
						App password
					</label>
					<div className="relative">
						<input
							id="appPassword"
							name="appPassword"
							type={showPassword ? "text" : "password"}
							autoComplete="current-password"
							placeholder="xxxx-xxxx-xxxx-xxxx"
							required
							className="w-full h-10 px-3 pr-10 rounded-xl border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors"
						>
							{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
						</button>
					</div>
				</div>
				<div className="flex items-end">
					<SubmitButton />
				</div>
			</form>

			<p className="text-[11.5px] text-ink/50 mt-3">
				{isConnected ? "Reconnect " : "Generate an app password at "}
				<a
					href="https://bsky.app/settings/app-passwords"
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary hover:underline"
				>
					bsky.app/settings/app-passwords
				</a>
				. App passwords can be revoked anytime without affecting your main password.
			</p>
			<p className="text-[11.5px] text-ink/50 mt-1.5">
				Tick <span className="text-ink/70">&ldquo;Allow access to your direct messages&rdquo;</span>{" "}
				when creating the app password so we can sync DMs into the inbox. Without
				it, mentions still work but DMs will be empty.
			</p>
		</div>
	);
}
