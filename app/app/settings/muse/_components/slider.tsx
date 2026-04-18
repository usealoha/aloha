"use client";

import { useState } from "react";

// Muse voice-training slider. Mirrors the current value into the <output>
// next to the label so users see live feedback as they drag, instead of
// the old static "50" that implied the control was broken.
export function Slider({
  name,
  label,
  defaultValue = 50,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-ink/75">{label}</span>
        <output
          htmlFor={name}
          className="text-[12px] text-ink/50 tabular-nums"
        >
          {value}
        </output>
      </div>
      <input
        id={name}
        name={name}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="mt-2 w-full accent-ink"
      />
    </label>
  );
}
