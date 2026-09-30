export type ScoreEvent = { points: number };

export function totalScore(events: ScoreEvent[]): number {
  return events.reduce((sum, event) => sum + event.points, 0);
}

export function rankByScore<T extends { score: number }>(items: T[]): Array<T & { rank: number }> {
  return [...items]
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function nextStreak(previousStreak: number, dailySuccess: boolean): number {
  return dailySuccess ? Math.max(0, previousStreak) + 1 : 0;
}
