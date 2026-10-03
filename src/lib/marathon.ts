// Student marathon week structure: 1–7, 8–13, 14–21.
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


export function kzDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function marathonDayFromDate(value: string | Date, marathonStart: string | Date) {
  const valueKey = kzDateKey(value);
  const startKey = kzDateKey(marathonStart);
  if (!valueKey || !startKey) return null;
  const valueUtc = Date.parse(valueKey + "T00:00:00Z");
  const startUtc = Date.parse(startKey + "T00:00:00Z");
  if (Number.isNaN(valueUtc) || Number.isNaN(startUtc)) return null;
  const day = Math.floor((valueUtc - startUtc) / 86_400_000) + 1;
  return day >= 1 && day <= 21 ? day : null;
}
