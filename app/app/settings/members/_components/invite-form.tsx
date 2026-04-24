"use client";

import { useRef, useState, useTransition } from "react";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendWorkspaceInvite } from "@/app/actions/workspace-invites";

const ROLE_CHOICES: Array<{ value: string; label: string }> = [
	{ value: "editor", label: "Editor" },
	{ value: "reviewer", label: "Reviewer" },
	{ value: "admin", label: "Admin" },
	{ value: "viewer", label: "Viewer" },
];

const ROLE_LABELS: Record<string, string> = Object.fromEntries(
	ROLE_CHOICES.map((r) => [r.value, r.label]),
);

export function InviteForm() {
	const formRef = useRef<HTMLFormElement>(null);
	const [isPending, startTransition] = useTransition();
	const [role, setRole] = useState("editor");

	const handleSubmit = (formData: FormData) => {
		const toastId = toast.loading("Sending invite…");
		startTransition(async () => {
			try {
				await sendWorkspaceInvite(formData);
				toast.success("Invite sent.", { id: toastId });
				formRef.current?.reset();
				setRole("editor");
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't send.",
					{ id: toastId },
				);
			}
		});
	};

	return (
		<form
			ref={formRef}
			action={handleSubmit}
			className="rounded-2xl border border-border bg-background-elev p-4 flex flex-wrap items-center gap-3"
		>
			<input
				type="email"
				name="email"
				required
				placeholder="teammate@example.com"
				className="flex-1 min-w-[240px] h-10 px-4 rounded-full border border-border bg-background text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
			/>
			<input type="hidden" name="role" value={role} />
			<Select.Root
				value={role}
				onValueChange={(next) => {
					if (next) setRole(next);
				}}
				items={ROLE_LABELS}
			>
				<Select.Trigger className="inline-flex items-center justify-between gap-2 h-10 min-w-[7.5rem] pl-4 pr-3 rounded-full border border-border-strong bg-background-elev text-[13px] font-medium text-ink hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors cursor-pointer">
					<Select.Value />
					<Select.Icon className="inline-flex">
						<ChevronDown className="w-4 h-4 text-ink/60" />
					</Select.Icon>
				</Select.Trigger>
				<Select.Portal>
					<Select.Positioner
						sideOffset={6}
						alignItemWithTrigger={false}
						className="z-50 outline-none"
					>
						<Select.Popup className="min-w-[max(7.5rem,var(--anchor-width))] rounded-2xl border border-border-strong bg-background-elev shadow-lg p-1 outline-none">
							{ROLE_CHOICES.map((r) => (
								<Select.Item
									key={r.value}
									value={r.value}
									className="relative flex items-center justify-between gap-3 pl-3 pr-8 h-9 rounded-xl text-[13px] text-ink cursor-pointer select-none outline-none data-[highlighted]:bg-muted/60 data-[selected]:font-medium"
								>
									<Select.ItemText>{r.label}</Select.ItemText>
									<Select.ItemIndicator className="absolute right-2.5 inline-flex items-center">
										<Check className="w-3.5 h-3.5 text-primary" />
									</Select.ItemIndicator>
								</Select.Item>
							))}
						</Select.Popup>
					</Select.Positioner>
				</Select.Portal>
			</Select.Root>
			<button
				type="submit"
				disabled={isPending}
				className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 transition-colors"
			>
				{isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
				Send invite
			</button>
		</form>
	);
}
