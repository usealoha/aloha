import Link from "next/link";
import { and, eq, gte, lt } from "drizzle-orm";
import {
  AlertCircle,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = (await getCurrentUser())!;
  const tz = user.timezone ?? "UTC";

  const params = await searchParams;
  const monthParam = first(params.month);
  const { year, month } = parseMonth(monthParam);

  // UTC bounds that overshoot the local-tz month by a day on each side —
  // safe overfetch, then we bucket by formatted date in user's tz.
  const fetchFrom = new Date(Date.UTC(year, month - 1, 1));
  fetchFrom.setUTCDate(fetchFrom.getUTCDate() - 2);
  const fetchTo = new Date(Date.UTC(year, month, 1));
  fetchTo.setUTCDate(fetchTo.getUTCDate() + 2);

  const rows = await db
    .select({
      id: posts.id,
      content: posts.content,
      platforms: posts.platforms,
      status: posts.status,
      scheduledAt: posts.scheduledAt,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(
      and(
        eq(posts.userId, user.id),
        // filter by whichever of (scheduledAt, publishedAt) exists — we treat
        // published posts as calendar entries too, anchored to publishedAt.
        gte(posts.scheduledAt, fetchFrom),
        lt(posts.scheduledAt, fetchTo),
      ),
    );

  // Bucket posts by tz-local YYYY-MM-DD.
  const buckets = new Map<string, typeof rows>();
  for (const r of rows) {
    const anchor = r.scheduledAt ?? r.publishedAt;
    if (!anchor) continue;
    const key = tzDateKey(anchor, tz);
    const list = buckets.get(key) ?? [];
    list.push(r);
    buckets.set(key, list);
  }

  const cells = buildGridCells(year, month, tz);
  const todayKey = tzDateKey(new Date(), tz);
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: tz,
  }).format(new Date(Date.UTC(year, month - 1, 15)));

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  const totalInMonth = rows.filter((r) => {
    const anchor = r.scheduledAt ?? r.publishedAt;
    if (!anchor) return false;
    const key = tzDateKey(anchor, tz);
    return key.startsWith(`${year}-${String(month).padStart(2, "0")}`);
  }).length;

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            {user.workspaceName ?? "Your workspace"} · {tz}
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            {monthLabel.split(" ")[0]}{" "}
            <span className="text-primary font-light italic">
              {monthLabel.split(" ")[1]}
            </span>
          </h1>
          <p className="mt-3 text-[14px] text-ink/65">
            {totalInMonth === 0
              ? "A clear month. Queue a post to start filling it in."
              : `${totalInMonth} post${totalInMonth === 1 ? "" : "s"} across the month.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-full border border-border-strong bg-background-elev overflow-hidden">
            <MonthLink
              month={prev}
              aria="Previous month"
              className="h-10 w-10 grid place-items-center text-ink/70 hover:text-ink hover:bg-muted/60"
            >
              <ChevronLeft className="w-4 h-4" />
            </MonthLink>
            <Link
              href="/app/calendar"
              className="h-10 px-4 inline-flex items-center text-[13px] font-medium text-ink hover:bg-muted/60 border-x border-border"
            >
              Today
            </Link>
            <MonthLink
              month={next}
              aria="Next month"
              className="h-10 w-10 grid place-items-center text-ink/70 hover:text-ink hover:bg-muted/60"
            >
              <ChevronRight className="w-4 h-4" />
            </MonthLink>
          </div>

          <Link
            href="/app/composer"
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
          >
            <CalendarPlus className="w-4 h-4" />
            New post
          </Link>
        </div>
      </header>

      {/* Grid */}
      <section className="rounded-3xl border border-border bg-background-elev overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAY_LABELS.map((d, i) => (
            <div
              key={d}
              className={cn(
                "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55",
                i < WEEKDAY_LABELS.length - 1 && "border-r border-border",
                i >= 5 && "bg-peach-100/40",
              )}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-[minmax(124px,1fr)]">
          {cells.map((cell, idx) => {
            const dayPosts = buckets.get(cell.key) ?? [];
            const isToday = cell.key === todayKey;
            const isWeekend = idx % 7 >= 5;
            const rightmost = idx % 7 === 6;
            const bottomRow = idx >= cells.length - 7;
            return (
              <div
                key={cell.key}
                className={cn(
                  "relative p-2.5 flex flex-col gap-1.5",
                  !rightmost && "border-r border-border",
                  !bottomRow && "border-b border-border",
                  !cell.inMonth && "bg-muted/30",
                  isWeekend && cell.inMonth && "bg-peach-100/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-[12px] tabular-nums",
                      isToday
                        ? "bg-primary text-background font-semibold"
                        : cell.inMonth
                          ? "text-ink/80"
                          : "text-ink/30",
                    )}
                  >
                    {cell.day}
                  </span>
                  {dayPosts.length > 0 ? (
                    <Link
                      href={`/app/composer?day=${cell.key}`}
                      className="text-[11px] text-ink/40 hover:text-ink transition-colors"
                      aria-label={`Add post on ${cell.key}`}
                    >
                      +
                    </Link>
                  ) : null}
                </div>

                <ul className="space-y-1 flex-1">
                  {dayPosts.slice(0, 3).map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/app/composer?post=${p.id}`}
                        className={cn(
                          "group block px-2 py-1.5 rounded-lg border text-[11.5px] leading-[1.35]",
                          postChipClasses(p.status),
                        )}
                      >
                        <div className="flex items-center gap-1 text-ink/60 mb-0.5">
                          <StatusIcon status={p.status} />
                          <span className="tabular-nums">
                            {formatTime(p.scheduledAt ?? p.publishedAt!, tz)}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-ink group-hover:text-ink/90">
                          {p.content}
                        </p>
                      </Link>
                    </li>
                  ))}
                  {dayPosts.length > 3 ? (
                    <li className="px-2 text-[11px] text-ink/55">
                      +{dayPosts.length - 3} more
                    </li>
                  ) : null}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Legend */}
      <section className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[12.5px] text-ink/65">
        <LegendSwatch kind="scheduled" label="Scheduled" />
        <LegendSwatch kind="published" label="Published" />
        <LegendSwatch kind="failed" label="Failed" />
        <LegendSwatch kind="draft" label="Draft" />
        <span className="inline-flex items-center gap-2 ml-auto">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          All times shown in {tz}.
        </span>
      </section>
    </div>
  );
}

// ── Components ─────────────────────────────────────────────────────────

function MonthLink({
  month,
  children,
  aria,
  className,
}: {
  month: { year: number; month: number };
  children: React.ReactNode;
  aria: string;
  className?: string;
}) {
  const q = `${month.year}-${String(month.month).padStart(2, "0")}`;
  return (
    <Link
      href={`/app/calendar?month=${q}`}
      aria-label={aria}
      className={cn("transition-colors", className)}
    >
      {children}
    </Link>
  );
}

function StatusIcon({ status }: { status: string }) {
  const className = "w-3 h-3";
  if (status === "published") return <CheckCircle2 className={className} />;
  if (status === "failed") return <AlertCircle className={className} />;
  if (status === "draft") return <Sparkles className={className} />;
  return <Clock className={className} />;
}

function postChipClasses(status: string) {
  if (status === "published") {
    return "bg-peach-100 border-peach-300 hover:border-peach-400";
  }
  if (status === "failed") {
    return "bg-background border-primary/30 text-primary-deep hover:border-primary";
  }
  if (status === "draft") {
    return "bg-muted/60 border-dashed border-border-strong hover:border-ink";
  }
  return "bg-background border-border-strong hover:border-ink";
}

function LegendSwatch({
  kind,
  label,
}: {
  kind: "scheduled" | "published" | "failed" | "draft";
  label: string;
}) {
  const swatch =
    kind === "published"
      ? "bg-peach-100 border-peach-300"
      : kind === "failed"
        ? "bg-background border-primary/40"
        : kind === "draft"
          ? "bg-muted/60 border-dashed border-border-strong"
          : "bg-background border-border-strong";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("w-3.5 h-3.5 rounded-md border", swatch)} />
      {label}
    </span>
  );
}

// ── Date helpers ───────────────────────────────────────────────────────

function parseMonth(input: string | undefined) {
  if (input && /^\d{4}-\d{2}$/.test(input)) {
    const [y, m] = input.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m };
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

function shiftMonth(year: number, month: number, delta: number) {
  const m = month + delta;
  if (m < 1) return { year: year - 1, month: 12 + m };
  if (m > 12) return { year: year + 1, month: m - 12 };
  return { year, month: m };
}

function tzDateKey(d: Date, tz: string) {
  // Produces YYYY-MM-DD in the given timezone.
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

function formatTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(d);
}

// Build a Monday-start 6-row grid containing the target month in the user's tz.
function buildGridCells(year: number, month: number, tz: string) {
  // First day of month in UTC — we'll map it into tz keys.
  const firstUtc = new Date(Date.UTC(year, month - 1, 1, 12));
  const firstKey = tzDateKey(firstUtc, tz);
  // Weekday index in tz (0 = Mon … 6 = Sun)
  const weekdayTz = tzWeekdayIndex(firstUtc, tz);
  // Step back to the Monday of the first week.
  const start = new Date(firstUtc);
  start.setUTCDate(start.getUTCDate() - weekdayTz);

  const cells: { day: number; key: string; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = tzDateKey(d, tz);
    const day = Number(key.slice(8, 10));
    const inMonth =
      key.slice(0, 7) === `${year}-${String(month).padStart(2, "0")}`;
    cells.push({ day, key, inMonth });
    if (i >= 34 && !cells.some((c) => c.key.slice(0, 7) > firstKey.slice(0, 7)))
      continue;
  }
  return cells;
}

function tzWeekdayIndex(d: Date, tz: string) {
  // Mon = 0, Sun = 6
  const name = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: tz,
  }).format(d);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[name] ?? 0;
}
