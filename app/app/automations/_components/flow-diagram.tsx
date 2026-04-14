import { cn } from "@/lib/utils";
import type { FlowNode } from "../_lib/templates";

export function FlowDiagram({ nodes }: { nodes: FlowNode[] }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-background-elev">
      {/* subtle decorative marks — hero-style */}
      <span
        aria-hidden
        className="absolute top-4 right-6 font-display text-[24px] text-ink/10 select-none"
      >
        ✳
      </span>
      <span
        aria-hidden
        className="absolute bottom-6 left-8 font-display text-[18px] text-primary/25 select-none rotate-12"
      >
        +
      </span>
      <span
        aria-hidden
        className="absolute top-1/2 right-10 w-2 h-2 rounded-full bg-primary/40"
      />

      <div className="relative px-8 py-14 lg:px-14 lg:py-16">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-0">
          {nodes.map((n, i) => (
            <div
              key={`${n.type}-${i}`}
              className={cn(
                "flex items-center gap-4 lg:gap-0",
                i > 0 && "lg:flex-[1.1]",
                "lg:flex-1",
              )}
            >
              {i > 0 ? <Connector /> : null}
              <NodeCard node={n} />
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between text-[12px] text-ink/55">
          <p className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Reads top-to-bottom on mobile, left-to-right on desktop.
          </p>
          <p>{nodes.length} step{nodes.length === 1 ? "" : "s"}</p>
        </div>
      </div>
    </div>
  );
}

function NodeCard({ node }: { node: FlowNode }) {
  const Icon = node.icon;
  const isTrigger = node.type === "trigger";

  return (
    <article
      className={cn(
        "relative flex-1 min-w-0 rounded-2xl border px-5 py-5",
        isTrigger
          ? "bg-peach-100 border-peach-300"
          : "bg-background border-border-strong",
      )}
    >
      <p
        className={cn(
          "text-[10.5px] font-semibold uppercase tracking-[0.22em]",
          isTrigger ? "text-ink" : "text-ink/55",
        )}
      >
        {isTrigger ? "Trigger" : "Action"}
      </p>
      <div className="mt-3 flex items-start gap-3">
        <span
          className={cn(
            "w-9 h-9 rounded-full grid place-items-center shrink-0 border",
            isTrigger
              ? "bg-ink text-background border-ink"
              : "bg-peach-100 border-border text-ink",
          )}
        >
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[18px] leading-[1.2] tracking-[-0.01em] text-ink">
            {node.title}
          </p>
          <p className="mt-1 text-[12.5px] text-ink/60 leading-[1.5]">
            {node.detail}
          </p>
        </div>
      </div>
    </article>
  );
}

function Connector() {
  return (
    <div className="hidden lg:flex items-center px-3 text-ink/40">
      <svg
        width="56"
        height="12"
        viewBox="0 0 56 12"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M0 6 L48 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          fill="none"
        />
        <path
          d="M46 1 L54 6 L46 11"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    </div>
  );
}
