export const REPORT_TIMEZONE = "Asia/Almaty";

export function timeToMinutes(value: string | null | undefined) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function currentAlmatyMinutes(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function isReportOpen(openTime: string | null | undefined, now = new Date()) {
  const openAt = timeToMinutes(openTime);
  if (openAt === null) return false;
  return currentAlmatyMinutes(now) >= openAt;
}

export function formatReportOpenTime(value: string | null | undefined) {
  const minutes = timeToMinutes(value);
  if (minutes === null) return "—";
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  return hour + ":" + minute;
}
