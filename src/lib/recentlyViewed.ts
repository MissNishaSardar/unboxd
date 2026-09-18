const STORAGE_KEY = "recently-viewed-v1";
const MAX_ITEMS = 12;

export function getRecentProductIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string")
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function recordProductView(productId: string) {
  if (typeof window === "undefined" || !productId) return;
  const next = [
    productId,
    ...getRecentProductIds().filter((id) => id !== productId),
  ].slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable. Browsing still works.
  }
}
