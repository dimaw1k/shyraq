export type TimeRange = { start: number; end: number };

export function mergeTimeRanges(ranges: TimeRange[]): TimeRange[] {
  const normalized = ranges
    .map((range) => ({ start: Math.max(0, range.start), end: Math.max(0, range.end) }))
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start);

  const merged: TimeRange[] = [];
  for (const range of normalized) {
    const previous = merged.at(-1);
    if (!previous || range.start > previous.end) {
      merged.push({ ...range });
    } else {
      previous.end = Math.max(previous.end, range.end);
    }
  }
  return merged;
}

export function watchedSeconds(ranges: TimeRange[], durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.min(durationSeconds, mergeTimeRanges(ranges).reduce((sum, range) => sum + (range.end - range.start), 0));
}

export function watchedPercent(ranges: TimeRange[], durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.min(100, (watchedSeconds(ranges, durationSeconds) / durationSeconds) * 100);
}

export function hasReachedWatchGate(ranges: TimeRange[], durationSeconds: number, requiredPercent = 85): boolean {
  return watchedPercent(ranges, durationSeconds) + Number.EPSILON >= requiredPercent;
}

export function upsertPlaybackRange(
  ranges: TimeRange[],
  start: number,
  end: number,
  durationSeconds: number,
): TimeRange[] {
  const safeDuration = Math.max(0, durationSeconds);
  return mergeTimeRanges([
    ...ranges,
    { start: Math.min(Math.max(0, start), safeDuration), end: Math.min(Math.max(0, end), safeDuration) },
  ]);
}
