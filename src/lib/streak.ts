const DAY_MS = 24 * 60 * 60 * 1000;

export type ReportActivity = {
  report_date: string;
  status?: string | null;
};

function toUtcDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function fromUtcDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function todayInTimezone(timeZone = "Asia/Almaty") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function shiftDate(value: string, delta: number) {
  const date = toUtcDay(value);
  date.setTime(date.getTime() + delta * DAY_MS);
  return fromUtcDay(date);
}

export function getSubmittedReportDates(reports: ReportActivity[]) {
  return [...new Set(
    reports
      .filter((report) => report.status !== "DRAFT")
      .map((report) => report.report_date),
  )].sort();
}

export function calculateCurrentStreak(
  reportDates: string[],
  today = todayInTimezone(),
) {
  const dates = new Set(reportDates);
  if (!dates.has(today)) return 0;

  let streak = 1;
  while (dates.has(shiftDate(today, -streak))) {
    streak += 1;
  }

  return streak;
}

export function calculateLongestStreak(reportDates: string[]) {
  const uniqueDates = [...new Set(reportDates)].sort();
  if (!uniqueDates.length) return 0;

  let longest = 1;
  let current = 1;

  for (let index = 1; index < uniqueDates.length; index += 1) {
    if (shiftDate(uniqueDates[index - 1], 1) === uniqueDates[index]) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}
