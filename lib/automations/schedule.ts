import type { StoredFlowStep } from "@/db/schema";

const DAY_TO_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

// Compute the next fire time for a weekly `{ day, hour }` schedule. If the
// target this week has already passed (or is within the next minute), jumps
// to next week. Returns a UTC-rounded minute boundary so the cron poller
// picks it up deterministically.
export function nextWeeklyFire(
  schedule: { day: string; hour: number },
  from: Date = new Date(),
): Date {
  const targetDay = DAY_TO_INDEX[schedule.day] ?? 1;
  const hour = Math.max(0, Math.min(23, Math.round(schedule.hour)));

  const next = new Date(from.getTime());
  next.setSeconds(0, 0);
  const currentDay = next.getDay();
  let delta = (targetDay - currentDay + 7) % 7;
  next.setHours(hour, 0, 0, 0);
  if (delta === 0 && next.getTime() <= from.getTime() + 60_000) delta = 7;
  next.setDate(next.getDate() + delta);
  return next;
}

// Compute next fire for a daily schedule — day-of-week is ignored, only the
// hour matters. Used by templates like `unsubscribe_spike_alert` that run
// every day regardless of the day picker in the schedule field.
export function nextDailyFire(
  schedule: { hour: number },
  from: Date = new Date(),
): Date {
  const hour = Math.max(0, Math.min(23, Math.round(schedule.hour)));
  const next = new Date(from.getTime());
  next.setSeconds(0, 0);
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= from.getTime() + 60_000) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

// Materialize the next fire timestamp for a freshly-saved automation based
// on its trigger step's config. Returns null for non-schedule triggers.
// Daily vs weekly is picked by trigger handler kind — kept here so callers
// don't need to branch.
export function materializeNextFireAt(
  steps: StoredFlowStep[],
  now: Date = new Date(),
): Date | null {
  const trigger = steps[0];
  if (!trigger || trigger.type !== "trigger") return null;
  if (trigger.kind !== "schedule") return null;

  const schedule = (trigger.config?.schedule ?? null) as
    | { day: string; hour: number }
    | null;
  if (!schedule) return null;

  // Daily cadence marker: handlers may set a `daily: true` flag alongside
  // the schedule to opt out of the day-of-week. For now we treat the
  // unsubscribe_spike_alert path via a separate dispatch in the cron job,
  // and default everything here to weekly.
  return nextWeeklyFire(schedule, now);
}
