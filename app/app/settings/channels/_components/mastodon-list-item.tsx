"use client";

import { MastodonIcon } from "@/app/auth/_components/provider-icons";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { disconnectMastodon } from "../../actions";
import { MastodonChannelItem } from "./mastodon-item";

type Props = {
	isConnected: boolean;
	isSoon: boolean;
};

export function MastodonListItem({ isConnected, isSoon }: Props) {
	const [showForm, setShowForm] = useState(false);
	const [disconnecting, setDisconnecting] = useState(false);

	const disconnectAction = async () => {
		setDisconnecting(true);
		await disconnectMastodon();
	};

	if (isSoon) {
		return (
			<li className="flex items-center gap-4 px-5 py-4">
				<span className="w-11 h-11 rounded-full border grid place-items-center shrink-0 bg-background border-border">
					<MastodonIcon className="w-[18px] h-[18px]" />
				</span>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<p className="text-[14.5px] text-ink font-medium">Mastodon</p>
						<span className="inline-flex items-center h-5 px-2 rounded-full border border-dashed border-border-strong text-[10.5px] text-ink/55 tracking-wide uppercase">
							Soon
						</span>
					</div>
					<p className="mt-1 text-[12.5px] text-ink/60">
						Federated posts to any instance.
					</p>
				</div>
				<button
					type="button"
					disabled
					className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-dashed border-border-strong text-[13px] text-ink/45 shrink-0"
				>
					Not available yet
				</button>
			</li>
		);
	}

	return (
		<>
			<li className="flex flex-col px-5 py-4">
				<div className="flex items-center gap-4">
					<span
						className={`w-11 h-11 rounded-full border grid place-items-center shrink-0 ${
							isConnected
								? "bg-peach-100 border-peach-300"
								: "bg-background border-border"
						}`}
					>
						<MastodonIcon className="w-[18px] h-[18px]" />
					</span>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<p className="text-[14.5px] text-ink font-medium">Mastodon</p>
							{isConnected ? (
								<span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ink text-background text-[10.5px] font-medium tracking-wide">
									<ShieldCheck className="w-3 h-3" />
									Connected
								</span>
							) : null}
						</div>
						<p className="mt-1 text-[12.5px] text-ink/60">
							{showForm
								? "Enter your Mastodon instance details"
								: "Federated posts to any instance."}
						</p>
					</div>
					<div className="flex items-center gap-1.5 shrink-0">
						{showForm ? (
							<>
								{isConnected ? (
									<button
										type="button"
										disabled={disconnecting}
										onClick={disconnectAction}
										className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-primary-deep hover:bg-peach-100/60 transition-colors disabled:opacity-50"
									>
										<Trash2 className="w-3.5 h-3.5" />
										Disconnect
									</button>
								) : null}
								<button
									type="button"
									onClick={() => setShowForm(false)}
									className="inline-flex items-center justify-center h-10 px-4 rounded-full hover:bg-peach-100 transition-colors"
								>
									<span className="text-[13px] text-ink font-medium">
										Close
									</span>
								</button>
							</>
						) : (
							<>
								<button
									type="button"
									onClick={() => setShowForm(true)}
									className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
								>
									{!isConnected ? <Plus className="w-3.5 h-3.5" /> : null}
									{isConnected ? "Reconnect" : "Connect"}
								</button>
							</>
						)}
					</div>
				</div>
				{showForm && (
					<li className="pl-15 py-4 bg-background-elev/50">
						<MastodonChannelItem
							isConnected={isConnected}
							isSoon={isSoon}
							isFormOpen={true}
							onClose={() => setShowForm(false)}
						/>
					</li>
				)}
			</li>
		</>
	);
}
