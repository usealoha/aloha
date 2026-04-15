"use client";

import { useRouter } from "next/navigation";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

type ViewMode = "month" | "week" | "day";

const VIEW_LABELS: Record<ViewMode, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
};

const ORDER: ViewMode[] = ["month", "week", "day"];

export function ViewSelect({
  value,
  anchorKey,
}: {
  value: ViewMode;
  anchorKey: string;
}) {
  const router = useRouter();
  return (
    <Select.Root
      value={value}
      onValueChange={(next) => {
        if (!next || next === value) return;
        router.push(`/app/calendar?view=${next}&date=${anchorKey}`);
      }}
      items={VIEW_LABELS}
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
            {ORDER.map((v) => (
              <Select.Item
                key={v}
                value={v}
                className="relative flex items-center justify-between gap-3 pl-3 pr-8 h-9 rounded-xl text-[13px] text-ink cursor-pointer select-none outline-none data-[highlighted]:bg-muted/60 data-[selected]:font-medium"
              >
                <Select.ItemText>{VIEW_LABELS[v]}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-2.5 inline-flex items-center">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
