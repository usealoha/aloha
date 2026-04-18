"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDate(v: string | undefined | null): Date | undefined {
  if (!v) return undefined;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

function formatLabel(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export interface DatePickerProps {
  /** Form field name — emits an ISO `yyyy-MM-dd` string. */
  name?: string;
  /** Initial ISO `yyyy-MM-dd` value (uncontrolled). */
  defaultValue?: string;
  /** Controlled ISO `yyyy-MM-dd` value. */
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Earliest selectable day (ISO). */
  minDate?: string;
  /** Latest selectable day (ISO). */
  maxDate?: string;
  className?: string;
  id?: string;
}

export function DatePicker({
  name,
  defaultValue,
  value: controlledValue,
  onChange,
  placeholder = "Pick a date",
  disabled,
  required,
  minDate,
  maxDate,
  className,
  id,
}: DatePickerProps) {
  const [internal, setInternal] = React.useState<Date | undefined>(() =>
    parseIsoDate(defaultValue),
  );
  const [open, setOpen] = React.useState(false);

  const isControlled = controlledValue !== undefined;
  const selected = isControlled ? parseIsoDate(controlledValue) : internal;
  const isoValue = selected ? toIsoDate(selected) : "";

  const handleSelect = (next: Date | undefined) => {
    if (!isControlled) setInternal(next);
    onChange?.(next ? toIsoDate(next) : undefined);
    if (next) setOpen(false);
  };

  const min = parseIsoDate(minDate);
  const max = parseIsoDate(maxDate);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "w-full h-11 px-4 inline-flex items-center justify-between gap-2 rounded-full border border-border bg-background text-[14px] text-ink focus:outline-none focus:border-ink disabled:opacity-50 disabled:cursor-not-allowed hover:border-border-strong transition-colors",
            !selected && "text-ink/40",
            className,
          )}
        >
          <span className="truncate">
            {selected ? formatLabel(selected) : placeholder}
          </span>
          <CalendarIcon className="w-4 h-4 text-ink/50 shrink-0" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[var(--anchor-width)] min-w-[260px] max-w-[360px] p-4"
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected}
            captionLayout="dropdown"
            disabled={
              min || max
                ? (d) => (!!min && d < min) || (!!max && d > max)
                : undefined
            }
            autoFocus
            className="w-full p-0 [--cell-size:--spacing(8)]"
            classNames={{
              root: "w-full",
              day: "group/day relative aspect-square flex-1 min-w-0 rounded-[var(--cell-radius)] p-0 text-center select-none",
            }}
          />
        </PopoverContent>
      </Popover>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={isoValue}
          required={required}
        />
      ) : null}
    </>
  );
}
