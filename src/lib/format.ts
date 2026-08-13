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
