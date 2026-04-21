"use client";

import { AlertCircle, Loader2, Plus } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { connectTelegram } from "../../actions";

type Props = {
	isConnected: boolean;
};

function SubmitButton({
	needsCode,
	needsPassword,
}: {
	needsCode: boolean;
	needsPassword: boolean;
}) {
	const { pending } = useFormStatus();
	let label = "Connect";
	if (needsCode) label = "Verify code";
	if (needsPassword) label = "Verify password";

	return (
		<button
			type="submit"
			disabled={pending}
			className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{pending ? (
				<>
					<Loader2 className="w-3.5 h-3.5 animate-spin" />
					{needsCode || needsPassword ? "Verifying..." : "Connecting..."}
				</>
			) : (
				<>
					{!needsCode && !needsPassword ? <Plus className="w-3.5 h-3.5" /> : null}
					{label}
				</>
			)}
		</button>
	);
}

export function TelegramChannelItem({ isConnected: _isConnected }: Props) {
	const [state, formAction] = useActionState(connectTelegram, null);
	const needsCode = Boolean(state?.needsCode);
	const needsPassword = Boolean(state?.needsPassword);

	return (
		<div className="w-full">
			{state?.error && (
				<div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 mb-3">
					<AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
					<p className="text-[13px] font-medium text-red-800">{state.error}</p>
				</div>
			)}

			{(needsCode || needsPassword) && (
				<div className="p-3 rounded-xl bg-primary-soft border border-primary/20 mb-3">
					<p className="text-[12.5px] text-ink">
						{needsCode
							? "A verification code was sent to your Telegram app. Enter it below."
							: "Your account has two-factor authentication enabled. Enter your password."}
					</p>
				</div>
			)}

			<form action={formAction} className="space-y-3">
				{needsCode ? (
					<div className="space-y-1">
						<label htmlFor="phoneCode" className="text-[12px] font-medium text-ink/70">
							Verification code
						</label>
						<input
							id="phoneCode"
							name="phoneCode"
							type="text"
							autoComplete="one-time-code"
							placeholder="12345"
							required
							className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
						/>
					</div>
				) : needsPassword ? (
					<div className="space-y-1">
						<label htmlFor="password" className="text-[12px] font-medium text-ink/70">
							2FA password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							autoComplete="off"
							placeholder="Your Telegram password"
							required
							className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
						/>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div className="space-y-1">
							<label htmlFor="phoneNumber" className="text-[12px] font-medium text-ink/70">
								Phone number
							</label>
							<input
								id="phoneNumber"
								name="phoneNumber"
								type="tel"
								autoComplete="tel"
								placeholder="+1234567890"
								required
								className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
							/>
						</div>
						<div className="space-y-1">
							<label htmlFor="chatId" className="text-[12px] font-medium text-ink/70">
								Chat ID
							</label>
							<input
								id="chatId"
								name="chatId"
								type="text"
								autoComplete="off"
								placeholder="@mychannel or -1001234567890"
								required
								className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
							/>
						</div>
						<div className="space-y-1">
							<label htmlFor="username" className="text-[12px] font-medium text-ink/70">
								Channel username
								<span className="text-ink/40 font-normal"> (optional)</span>
							</label>
							<input
								id="username"
								name="username"
								type="text"
								autoComplete="off"
								placeholder="@mychannel"
								className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
							/>
						</div>
					</div>
				)}

				<div className="flex justify-end">
					<SubmitButton needsCode={needsCode} needsPassword={needsPassword} />
				</div>
			</form>

			{!needsCode && !needsPassword && (
				<details className="text-[11.5px] text-ink/50 mt-3">
					<summary className="cursor-pointer hover:text-ink/70">How it works</summary>
					<ol className="mt-1.5 pl-2 list-decimal list-inside space-y-1">
						<li>Enter your phone number with country code</li>
						<li>Enter the target channel username or chat ID</li>
						<li>Click Connect to receive a verification code in your Telegram app</li>
						<li>Enter the code to complete authentication</li>
						<li>If you have 2FA enabled, you&apos;ll also need to enter your password</li>
					</ol>
				</details>
			)}
		</div>
	);
}
