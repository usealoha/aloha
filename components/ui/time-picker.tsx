"use client";

import * as React from "react";
import { Select } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function generateHours(): string[] {
  return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
}

function clampMinute(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 2);
  if (!digits) return "00";
  const n = Math.min(59, Math.max(0, parseInt(digits, 10)));
  return String(n).padStart(2, "0");
}

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [hours, minutes] = value.split(":");
  const hourItems = generateHours();
  const [minuteDraft, setMinuteDraft] = React.useState<string>(minutes || "00");

  React.useEffect(() => {
    setMinuteDraft(minutes || "00");
  }, [minutes]);

  const handleHourChange = (newHour: string | null) => {
    if (!newHour) return;
    onChange(`${newHour}:${minutes || "00"}`);
  };

  const commitMinute = () => {
    const normalized = clampMinute(minuteDraft);
    setMinuteDraft(normalized);
    if (normalized !== (minutes || "00")) {
      onChange(`${hours || "12"}:${normalized}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Hours Select */}
      <Select.Root
        value={hours || "12"}
        onValueChange={handleHourChange}
        disabled={disabled}
      >
        <Select.Trigger className="inline-flex items-center justify-between gap-2 h-10 min-w-[4.5rem] pl-3 pr-2 rounded-xl border border-border-strong bg-background text-[14px] text-ink hover:border-ink/50 focus-visible:outline-none focus-visible:border-ink transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          <Select.Value />
          <Select.Icon className="inline-flex">
            <ChevronDown className="w-3.5 h-3.5 text-ink/50" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner sideOffset={4} className="z-50 outline-none">
            <Select.Popup className="min-w-[var(--anchor-width)] max-h-[200px] overflow-auto rounded-xl border border-border-strong bg-background-elev shadow-lg p-1 outline-none">
              {hourItems.map((h) => (
                <Select.Item
                  key={h}
                  value={h}
                  className="relative flex items-center justify-center h-8 rounded-lg text-[13px] text-ink cursor-pointer select-none outline-none data-[highlighted]:bg-muted data-[selected]:bg-ink data-[selected]:text-background"
                >
                  <Select.ItemText>{h}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>

      <span className="text-ink/40 font-medium">:</span>

      {/* Minutes input — free entry, 0–59 */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={minuteDraft}
        disabled={disabled}
        onChange={(e) => setMinuteDraft(e.target.value.replace(/\D/g, "").slice(0, 2))}
        onBlur={commitMinute}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitMinute();
            (e.target as HTMLInputElement).blur();
          }
        }}
        onFocus={(e) => e.currentTarget.select()}
        className="h-10 w-[4.5rem] px-3 rounded-xl border border-border-strong bg-background text-[14px] text-ink text-center tabular-nums hover:border-ink/50 focus-visible:outline-none focus-visible:border-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
