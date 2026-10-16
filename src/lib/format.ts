const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPrice(
  value: number | string | { toString(): string },
): string {
  return inrFormatter.format(Number(value));
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(value: Date | string): string {
  return dateFormatter.format(new Date(value));
}

const dayFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

export function formatDayMonth(value: Date | string): string {
  return dayFormatter.format(new Date(value));
}

export function formatEndsIn(
  endsAt: Date | string | null | undefined,
  now: Date | number = Date.now(),
): string | null {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  if (!Number.isFinite(end)) return null;
  const nowTime = now instanceof Date ? now.getTime() : now;
  const days = Math.ceil((end - nowTime) / 86400000);
  if (days <= 0) return "Ends today";
  if (days === 1) return "Ends tomorrow";
  if (days <= 30) return `Ends in ${days} days`;
  return null;
}
