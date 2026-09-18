export function clampDiscountPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.floor(value)));
}

export function mrp(basePrice: number, priceDiff: number): number {
  return basePrice + priceDiff;
}

export function effectivePrice(
  basePrice: number,
  priceDiff: number,
  discountPercent: number,
): number {
  const mrpValue = mrp(basePrice, priceDiff);
  const clamped = clampDiscountPercent(discountPercent);
  if (clamped === 0) return mrpValue;
  return Math.round((mrpValue * (100 - clamped)) / 100);
}

export function hasDiscount(discountPercent: number): boolean {
  return clampDiscountPercent(discountPercent) > 0;
}

export function discountBadge(discountPercent: number): string | null {
  const clamped = clampDiscountPercent(discountPercent);
  return clamped > 0 ? `${clamped}% off` : null;
}
