export const isUploadedImage = (url: string) => url.startsWith("/uploads/");

// Real product images per slug, category-accurate, unique across catalog.
// Unsplash IDs chosen to match product type, each slug gets a distinct photo.
const REAL_PRODUCT_IMAGES: Record<string, string> = {
  "iphone-15-pro":
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
  "galaxy-s24-ultra":
    "https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?auto=format&fit=crop&w=800&q=80",
  "pixel-8-pro":
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
  "oneplus-12":
    "https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=800&q=80",
  "xiaomi-14":
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
  "nothing-phone-2a":
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
  "macbook-air-m3":
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
  "macbook-pro-14":
    "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80",
  "dell-xps-13":
    "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
  "thinkpad-x1-carbon":
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
  "rog-zephyrus-g14":
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
  "hp-spectre-x360":
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
  "sony-wh-1000xm5":
    "https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=800&q=80",
  "sennheiser-hd-650":
    "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=800&q=80",
  "bose-qc-ultra":
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
  "airpods-pro-2":
    "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80",
  "galaxy-buds-2-pro":
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
  "nothing-ear-2":
    "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=800&q=80",
  "jbl-flip-6":
    "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
  "sonos-one-gen2":
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
  "soundcore-q30":
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
  "anker-65w-gan":
    "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=800&q=80",
  "apple-20w-adapter":
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
  "anker-usb-c-240w":
    "https://images.unsplash.com/photo-1629131726692-1bdd1d04c55a?auto=format&fit=crop&w=800&q=80",
  "spigen-ultra-hybrid":
    "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=800&q=80",
  "samsung-25w-charger":
    "https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&w=800&q=80",
};

// Fallback by category when slug not in map, also distinct per category
const CATEGORY_FALLBACK: Record<string, string> = {
  smartphones: REAL_PRODUCT_IMAGES["iphone-15-pro"]!,
  laptops: REAL_PRODUCT_IMAGES["macbook-air-m3"]!,
  "gaming-laptops": REAL_PRODUCT_IMAGES["rog-zephyrus-g14"]!,
  headphones: REAL_PRODUCT_IMAGES["sony-wh-1000xm5"]!,
  earbuds: REAL_PRODUCT_IMAGES["airpods-pro-2"]!,
  speakers: REAL_PRODUCT_IMAGES["jbl-flip-6"]!,
  "chargers-cables": REAL_PRODUCT_IMAGES["anker-65w-gan"]!,
  "cases-protection": REAL_PRODUCT_IMAGES["spigen-ultra-hybrid"]!,
};

function getRealImageForSeed(
  seed: string,
  options?: { allowIndexSuffix?: boolean },
): string | null {
  // Direct slug match first, no stripping
  if (REAL_PRODUCT_IMAGES[seed]) return REAL_PRODUCT_IMAGES[seed]!;
  // Only strip a trailing -<digits> gallery suffix when the caller
  // explicitly built seedWithIndex (index > 0). This avoids mis-resolving
  // a future slug that legitimately ends in -<digits> without an index.
  if (options?.allowIndexSuffix) {
    const base = seed.replace(/-\d+$/, "");
    if (base !== seed && REAL_PRODUCT_IMAGES[base])
      return REAL_PRODUCT_IMAGES[base]!;
  }
  // Category fallback, also without stripping
  if (CATEGORY_FALLBACK[seed]) return CATEGORY_FALLBACK[seed]!;
  return null;
}

export const getPlaceholderPhotoUrl = (seed: string, index = 0) => {
  // Allow suffix stripping only when a gallery index was appended
  const real = getRealImageForSeed(seed, { allowIndexSuffix: index > 0 });
  if (real) return real;
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/800`;
};

export const resolveProductImageUrl = (
  url: string,
  seed: string,
  index = 0,
): string => {
  if (!url || url.includes("placehold.co") || url.includes("picsum.photos")) {
    const seedWithIndex = index ? `${seed}-${index}` : seed;
    return getPlaceholderPhotoUrl(seedWithIndex, index);
  }
  // If DB already stores a real unsplash url that is in our map, keep it
  // For legacy picsum entries, they are caught above
  return url;
};
