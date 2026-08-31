export const isUploadedImage = (url: string) => url.startsWith("/uploads/");

export const isTextPlaceholder = (url: string) => url.includes("placehold.co");

export const getPlaceholderPhotoUrl = (seed: string) =>
  `https://picsum.photos/seed/${seed}/800/800`;

export const resolveProductImageUrl = (
  url: string,
  seed: string,
  index = 0,
): string => {
  if (!url || isTextPlaceholder(url)) {
    return getPlaceholderPhotoUrl(index ? `${seed}-${index}` : seed);
  }
  return url;
};
