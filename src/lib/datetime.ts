const TIME_ZONE = "Asia/Almaty";

function partsFor(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

export function formatKzDateTime(value: string) {
  const parts = partsFor(value);
  if (!parts) return "";

  return (
    parts.day +
    "." +
    parts.month +
    "." +
    parts.year +
    " " +
    parts.hour +
    ":" +
    parts.minute +
    ":" +
    parts.second
  );
}

export function toKzDatetimeLocal(value: string) {
  const parts = partsFor(value);
  if (!parts) return "";

  return (
    parts.year +
    "-" +
    parts.month +
    "-" +
    parts.day +
    "T" +
    parts.hour +
    ":" +
    parts.minute +
    ":" +
    parts.second
  );
}

export function isoDaysAgo(days: number) {
  const safeDays = Number.isFinite(days) ? Math.max(0, days) : 0;
  return new Date(Date.now() - safeDays * 86_400_000).toISOString();
}

export function isDateInFuture(value: string) {
  return new Date(value).getTime() > Date.now();
}

function isValidKzLocal(parts: {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
}) {
  const date = new Date(
    parts.year +
      "-" +
      parts.month +
      "-" +
      parts.day +
      "T" +
      parts.hour +
      ":" +
      parts.minute +
      ":" +
      parts.second +
      "+05:00",
  );

  if (Number.isNaN(date.getTime())) return false;

  const normalized = partsFor(date);
  if (!normalized) return false;

  return (
    normalized.year === parts.year &&
    normalized.month === parts.month &&
    normalized.day === parts.day &&
    normalized.hour === parts.hour &&
    normalized.minute === parts.minute &&
    normalized.second === parts.second
  );
}

export function parseKzDateTime(value: string): string | null | undefined {
  const raw = value.trim();
  if (!raw) return null;

  const localMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (localMatch) {
    const [, year, month, day, hour, minute, second = "00"] = localMatch;
    const parts = { year, month, day, hour, minute, second };

    if (!isValidKzLocal(parts)) return undefined;

    return (
      year +
      "-" +
      month +
      "-" +
      day +
      "T" +
      hour +
      ":" +
      minute +
      ":" +
      second +
      "+05:00"
    );
  }

  const legacyMatch = raw.match(
    /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!legacyMatch) return undefined;

  const [_, day, month, year, hour, minute, second = "00"] = legacyMatch;
  const parts = { year, month, day, hour, minute, second };

  if (!isValidKzLocal(parts)) return undefined;

  return (
    year +
    "-" +
    month +
    "-" +
    day +
    "T" +
    hour +
    ":" +
    minute +
    ":" +
    second +
    "+05:00"
  );
}
