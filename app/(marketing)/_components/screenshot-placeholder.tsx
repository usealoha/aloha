// Marks where a real product screenshot should replace an illustrated mock.
// Grep the codebase for `data-placeholder="SCREENSHOT_PLACEHOLDER"` or the
// component name to find every slot across marketing pages.

type Props = {
  label: string;
  notes: string;
  aspect?: string;
  tone?: string;
  id?: string;
};

export function ScreenshotPlaceholder({
  label,
  notes,
  aspect = "aspect-[5/3]",
  tone = "bg-peach-100",
  id,
}: Props) {
  const grainId = `grain-${id ?? Math.random().toString(36).slice(2, 8)}`;
  return (
    <div
      className={`relative ${aspect} ${tone} rounded-3xl border border-border-strong overflow-hidden`}
      data-placeholder="SCREENSHOT_PLACEHOLDER"
    >
      <svg
        aria-hidden
        viewBox="0 0 400 320"
        className="absolute inset-0 w-full h-full opacity-[0.18] mix-blend-multiply"
      >
        <filter id={grainId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </svg>
      <span aria-hidden className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 border-ink/30" />
      <span aria-hidden className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 border-ink/30" />
      <span aria-hidden className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 border-ink/30" />
      <span aria-hidden className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-ink/30" />

      <div className="absolute inset-0 p-8 flex flex-col">
        <span className="self-start text-[9px] font-mono uppercase tracking-[0.22em] text-ink/50 bg-background-elev/80 px-2 py-1 rounded-full">
          Screenshot · placeholder
        </span>
        <div className="mt-auto">
          <p className="font-display text-[22px] lg:text-[26px] leading-[1.15] tracking-[-0.01em] text-ink max-w-md">
            {label}
          </p>
          <p className="mt-3 text-[12.5px] font-mono text-ink/60 leading-[1.5] max-w-md">
            {notes}
          </p>
        </div>
      </div>
    </div>
  );
}
