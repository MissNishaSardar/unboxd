export const isUploadedImage = (url: string) => url.startsWith("/uploads/");

// Single source: picsum.photos only — deterministic per slug/index.
// Keep placehold.co fallback for existing DBs that still contain legacy URLs.
export const getPlaceholderPhotoUrl = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/800`;

export const resolveProductImageUrl = (
  url: string,
  seed: string,
  index = 0,
): string => {
  if (!url || url.includes("placehold.co")) {
    return getPlaceholderPhotoUrl(index ? `${seed}-${index}` : seed);
  }
  return url;
};
