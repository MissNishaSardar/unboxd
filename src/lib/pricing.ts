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

export type DiscountWindow = {
  discountPercent: number;
  discountStartsAt?: Date | string | null;
  discountEndsAt?: Date | string | null;
};

function toTime(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function toNowTime(now: Date | number): number {
  return now instanceof Date ? now.getTime() : now;
}

export function isDiscountActive(
  window: DiscountWindow,
  now: Date | number = Date.now(),
): boolean {
  const percent = clampDiscountPercent(window.discountPercent);
  if (percent === 0) return false;
  const nowTime = toNowTime(now);
  const startsAt = toTime(window.discountStartsAt ?? null);
  const endsAt = toTime(window.discountEndsAt ?? null);
  if (startsAt !== null && nowTime < startsAt) return false;
  if (endsAt !== null && nowTime >= endsAt) return false;
  return true;
}

export function activeDiscountPercent(
  window: DiscountWindow,
  now: Date | number = Date.now(),
): number {
  return isDiscountActive(window, now) ?
      clampDiscountPercent(window.discountPercent)
    : 0;
}

export type DealStatus = "live" | "scheduled" | "expired" | "none";
export function dealStatus(
  window: DiscountWindow,
  now: Date | number = Date.now(),
): DealStatus {
  const percent = clampDiscountPercent(window.discountPercent);
  if (percent === 0) return "none";
  const nowTime = toNowTime(now);
  const startsAt = toTime(window.discountStartsAt ?? null);
  const endsAt = toTime(window.discountEndsAt ?? null);
  if (startsAt !== null && nowTime < startsAt) return "scheduled";
  if (endsAt !== null && nowTime >= endsAt) return "expired";
  return "live";
}

export function combineDiscountPercent(
  productPercent: number,
  globalPercent: number,
): number {
  return Math.max(
    clampDiscountPercent(productPercent),
    clampDiscountPercent(globalPercent),
  );
}
