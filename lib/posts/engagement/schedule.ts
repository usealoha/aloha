// Engagement snapshots follow a decay curve: most action happens in the
// first day, the long tail tapers fast. We capture 7 well-placed
// snapshots per delivery (publish + 6 follow-ups) and then stop. Returns
// the next absolute timestamp at which a snapshot is due, or null when
// the curve has played out.

const OFFSETS_HOURS = [1, 6, 24, 72, 7 * 24, 30 * 24] as const;

export function nextMetricSyncAt(
  publishedAt: Date,
  lastSnapshotAt: Date,
): Date | null {
  const elapsedHours = hoursBetween(publishedAt, lastSnapshotAt);
  // Find the first scheduled offset that lies strictly after the most
  // recent snapshot. Treat the publish-time snapshot as offset 0.
  const next = OFFSETS_HOURS.find((h) => h > elapsedHours);
  if (next === undefined) return null;
  return new Date(publishedAt.getTime() + next * 60 * 60 * 1000);
}

function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (60 * 60 * 1000);
}
