export type MarathonWeek = {
  week: 1 | 2 | 3;
  startDay: number;
  endDay: number;
  title: string;
  subtitle: string;
};

export const MARATHON_WEEKS: MarathonWeek[] = [
  { week: 1, startDay: 1, endDay: 7, title: "Шырақ марафоны", subtitle: "1-апта · 1–7 күн" },
  { week: 2, startDay: 8, endDay: 13, title: "Шырақ марафоны", subtitle: "2-апта · 8–13 күн" },
  { week: 3, startDay: 14, endDay: 21, title: "Шырақ марафоны", subtitle: "3-апта · 14–21 күн" },
];

export function getMarathonWeek(week: number) {
  return MARATHON_WEEKS.find((item) => item.week === week) ?? null;
}

export function getMarathonWeekForDay(day: number) {
  return MARATHON_WEEKS.find((item) => day >= item.startDay && day <= item.endDay) ?? null;
}
