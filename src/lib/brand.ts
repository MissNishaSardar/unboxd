export const brandToSlug = (brand: string) =>
  brand
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const BRAND_MAP: Record<string, { brand: string; brandSlug: string }> = {
  "iphone-15-pro": { brand: "Apple", brandSlug: "apple" },
  "galaxy-s24-ultra": { brand: "Samsung", brandSlug: "samsung" },
  "pixel-8-pro": { brand: "Google", brandSlug: "google" },
  "oneplus-12": { brand: "OnePlus", brandSlug: "oneplus" },
  "xiaomi-14": { brand: "Xiaomi", brandSlug: "xiaomi" },
  "nothing-phone-2a": { brand: "Nothing", brandSlug: "nothing" },
  "macbook-air-m3": { brand: "Apple", brandSlug: "apple" },
  "macbook-pro-14": { brand: "Apple", brandSlug: "apple" },
  "dell-xps-13": { brand: "Dell", brandSlug: "dell" },
  "thinkpad-x1-carbon": { brand: "Lenovo", brandSlug: "lenovo" },
  "rog-zephyrus-g14": { brand: "ASUS", brandSlug: "asus" },
  "hp-spectre-x360": { brand: "HP", brandSlug: "hp" },
  "sony-wh-1000xm5": { brand: "Sony", brandSlug: "sony" },
  "sennheiser-hd-650": { brand: "Sennheiser", brandSlug: "sennheiser" },
  "bose-qc-ultra": { brand: "Bose", brandSlug: "bose" },
  "airpods-pro-2": { brand: "Apple", brandSlug: "apple" },
  "galaxy-buds-2-pro": { brand: "Samsung", brandSlug: "samsung" },
  "nothing-ear-2": { brand: "Nothing", brandSlug: "nothing" },
  "jbl-flip-6": { brand: "JBL", brandSlug: "jbl" },
  "sonos-one-gen2": { brand: "Sonos", brandSlug: "sonos" },
  "soundcore-q30": { brand: "Anker", brandSlug: "anker" },
  "anker-65w-gan": { brand: "Anker", brandSlug: "anker" },
  "apple-20w-adapter": { brand: "Apple", brandSlug: "apple" },
  "anker-usb-c-240w": { brand: "Anker", brandSlug: "anker" },
  "spigen-ultra-hybrid": { brand: "Spigen", brandSlug: "spigen" },
  "samsung-25w-charger": { brand: "Samsung", brandSlug: "samsung" },
};

export const displayProductName = (name: string, brand: string): string => {
  const cleanName = name.trim();
  const cleanBrand = brand.trim();
  if (!cleanName || !cleanBrand) return cleanName;
  const lowerName = cleanName.toLowerCase();
  const lowerBrand = cleanBrand.toLowerCase();
  if (lowerName === lowerBrand) return cleanName;
  const startsWithBrand =
    lowerName.startsWith(lowerBrand + " ") ||
    lowerName.startsWith(lowerBrand + "-") ||
    lowerName.startsWith(lowerBrand + ":");
  if (!startsWithBrand) return cleanName;
  const candidate = cleanName
    .slice(cleanBrand.length)
    .replace(/^[\s\-:]+/, "")
    .trim();
  if (!candidate || candidate.length < 3) return cleanName;
  return candidate;
};
