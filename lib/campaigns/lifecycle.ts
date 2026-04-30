// Lifecycle status derived from current time vs the campaign's date range.
// `scheduled` = approved but the run hasn't started; `running` = inside the
// window; `complete` = window has passed. The approve and resume actions
// plant the initial status using this table, and the hourly rollover cron
// reconciles campaigns that cross a boundary while sitting still — keep
// every caller routed through this helper so they agree.
export function computeLifecycleStatus(
  now: Date,
  rangeStart: Date,
  rangeEnd: Date,
): "scheduled" | "running" | "complete" {
  if (now < rangeStart) return "scheduled";
  if (now > rangeEnd) return "complete";
  return "running";
}
