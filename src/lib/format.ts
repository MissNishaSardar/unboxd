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
