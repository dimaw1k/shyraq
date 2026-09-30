export function normalizePhone(input: string): string {
  const value = input.trim();
  const digits = value.replace(/\D/g, "");

  // A number explicitly written with the +7 country code must contain
  // 11 digits total: 7 + 10 subscriber digits.
  if (value.startsWith("+7")) {
    return digits.length === 11 ? `+${digits}` : value;
  }

  if (digits.startsWith("8") && digits.length === 11) return `+7${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;

  return value;
}

export function isValidKzPhone(input: string): boolean {
  return /^\+7\d{10}$/.test(normalizePhone(input));
}
