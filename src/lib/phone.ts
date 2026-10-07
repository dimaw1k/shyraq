export function normalizePhone(input: string): string {
  const value = input.trim();
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("8") && digits.length === 11) return `+7${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;

  return value;
}

export function formatKzPhone(input: string): string {
  const digits = input.replace(/\D/g, "");

  let subscriber = digits;

  if (digits.startsWith("8") && digits.length > 0) {
    subscriber = digits.slice(1);
  } else if (digits.startsWith("7") && digits.length > 0) {
    subscriber = digits.slice(1);
  }

  subscriber = subscriber.slice(0, 10);

  if (!subscriber) {
    return digits.startsWith("7") || digits.startsWith("8") ? "+7 (" : "";
  }

  const operator = subscriber.slice(0, 3);
  const part1 = subscriber.slice(3, 6);
  const part2 = subscriber.slice(6, 8);
  const part3 = subscriber.slice(8, 10);

  let result = `+7 (${operator}`;
  if (operator.length === 3) result += ")";

  if (part1) result += ` ${part1}`;
  if (part2) result += ` ${part2}`;
  if (part3) result += ` ${part3}`;

  return result;
}

export function isValidKzPhone(input: string): boolean {
  return /^\+7\d{10}$/.test(normalizePhone(input));
}


export function displayKzPhone(input: string | null | undefined): string {
  const value = typeof input === "string" ? input.trim() : "";
  if (!value) return "—";
  const formatted = formatKzPhone(value);
  return formatted || value;
}
