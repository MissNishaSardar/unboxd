import "dotenv/config";
import { PrismaClient } from "@generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL ?? "" }),
});

type SeedVariant = { name: string; priceDiff: number; stock: number };

type SeedProduct = {
  name: string;
  slug: string;
  category: string;
  description: string;
  basePrice: number;
  featured?: boolean;
  images: string[];
  variants: SeedVariant[];
};

const categories: { name: string; slug: string; parent?: string }[] = [
  { name: "Phones", slug: "phones" },
  { name: "Smartphones", slug: "smartphones", parent: "phones" },
  { name: "Laptops", slug: "laptops" },
  { name: "Gaming Laptops", slug: "gaming-laptops", parent: "laptops" },
  { name: "Audio", slug: "audio" },
  { name: "Headphones", slug: "headphones", parent: "audio" },
  { name: "Earbuds", slug: "earbuds", parent: "audio" },
  { name: "Speakers", slug: "speakers", parent: "audio" },
  { name: "Accessories", slug: "accessories" },
  { name: "Chargers & Cables", slug: "chargers-cables", parent: "accessories" },
  {
    name: "Cases & Protection",
    slug: "cases-protection",
    parent: "accessories",
  },
];

const products: SeedProduct[] = [
  {
    name: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    category: "smartphones",
    description:
      "Titanium-framed flagship with the A17 Pro chip, a 48MP pro camera system and an always-on ProMotion display.",
    basePrice: 119900,
    featured: true,
    images: ["https://placehold.co/800x800/111/fff?text=iPhone+15+Pro"],
    variants: [
      { name: "Natural Titanium / 256GB", priceDiff: 0, stock: 12 },
      { name: "Blue Titanium / 256GB", priceDiff: 0, stock: 8 },
      { name: "Black Titanium / 512GB", priceDiff: 15000, stock: 5 },
    ],
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    slug: "galaxy-s24-ultra",
    category: "smartphones",
    description:
      "Galaxy AI-powered flagship with a 200MP camera, built-in S Pen and a 6.8-inch QHD+ AMOLED display.",
    basePrice: 129999,
    featured: true,
    images: ["https://placehold.co/800x800/111/fff?text=S24+Ultra"],
    variants: [
      { name: "Titanium Gray / 256GB", priceDiff: 0, stock: 15 },
      { name: "Titanium Violet / 512GB", priceDiff: 12000, stock: 6 },
      { name: "Titanium Black / 1TB", priceDiff: 30000, stock: 2 },
    ],
  },
  {
    name: "Google Pixel 8 Pro",
    slug: "pixel-8-pro",
    category: "smartphones",
    description:
      "Pixel's best camera with Magic Editor, 7 years of OS updates and the Tensor G3 chip.",
    basePrice: 109999,
    images: ["https://placehold.co/800x800/111/fff?text=Pixel+8+Pro"],
    variants: [
      { name: "Obsidian / 128GB", priceDiff: 0, stock: 10 },
      { name: "Porcelain / 256GB", priceDiff: 9000, stock: 4 },
    ],
  },
  {
    name: "OnePlus 12",
    slug: "oneplus-12",
    category: "smartphones",
    description:
      "Snapdragon 8 Gen 3, 2K 120Hz LTPO display and 100W SUPERVOOC charging with a 5400mAh battery.",
    basePrice: 64999,
    images: ["https://placehold.co/800x800/111/fff?text=OnePlus+12"],
    variants: [
      { name: "Flowy Emerald / 12GB+256GB", priceDiff: 0, stock: 20 },
      { name: "Silky Black / 16GB+512GB", priceDiff: 8000, stock: 9 },
    ],
  },
  {
    name: "Xiaomi 14",
    slug: "xiaomi-14",
    category: "smartphones",
    description:
      "Compact flagship with a Leica-tuned camera system, Snapdragon 8 Gen 3 and a 1.5K LTPO display.",
    basePrice: 59999,
    images: ["https://placehold.co/800x800/111/fff?text=Xiaomi+14"],
    variants: [
      { name: "Black / 12GB+256GB", priceDiff: 0, stock: 14 },
      { name: "White / 12GB+512GB", priceDiff: 6000, stock: 0 },
    ],
  },
  {
    name: "Nothing Phone (2a)",
    slug: "nothing-phone-2a",
    category: "smartphones",
    description:
      "Budget-friendly Nothing with the signature Glyph interface and a clean, bloat-free OS.",
    basePrice: 27999,
    images: ["https://placehold.co/800x800/111/fff?text=Phone+2a"],
    variants: [
      { name: "Black / 8GB+128GB", priceDiff: 0, stock: 25 },
      { name: "Milk / 12GB+256GB", priceDiff: 4000, stock: 11 },
    ],
  },
  {
    name: "MacBook Air 13 (M3)",
    slug: "macbook-air-m3",
    category: "laptops",
    description:
      "Ultra-thin M3 laptop with an 18-hour battery, Liquid Retina display and silent fanless design.",
    basePrice: 114900,
    featured: true,
    images: ["https://placehold.co/800x800/111/fff?text=MacBook+Air+M3"],
    variants: [
      { name: "Midnight / 8GB+256GB", priceDiff: 0, stock: 7 },
      { name: "Starlight / 8GB+512GB", priceDiff: 15000, stock: 5 },
      { name: "Space Gray / 16GB+512GB", priceDiff: 30000, stock: 3 },
    ],
  },
  {
    name: "MacBook Pro 14 (M3 Pro)",
    slug: "macbook-pro-14",
    category: "laptops",
    description:
      "Pro-grade power in a 14-inch frame: M3 Pro, 120Hz Liquid Retina XDR and up to 18 hours of battery.",
    basePrice: 199900,
    featured: true,
    images: ["https://placehold.co/800x800/111/fff?text=MacBook+Pro+14"],
    variants: [
      { name: "Space Black / 18GB+512GB", priceDiff: 0, stock: 4 },
      { name: "Silver / 36GB+1TB", priceDiff: 50000, stock: 2 },
    ],
  },
  {
    name: "Dell XPS 13 (9340)",
    slug: "dell-xps-13",
    category: "laptops",
    description:
      "Premium ultrabook with an edge-to-edge display, Intel Core Ultra 7 and a CNC aluminium chassis.",
    basePrice: 149990,
    images: ["https://placehold.co/800x800/111/fff?text=Dell+XPS+13"],
    variants: [
      { name: "Platinum / 16GB+512GB", priceDiff: 0, stock: 6 },
      { name: "Graphite / 32GB+1TB", priceDiff: 25000, stock: 3 },
    ],
  },
  {
    name: "Lenovo ThinkPad X1 Carbon Gen 12",
    slug: "thinkpad-x1-carbon",
    category: "laptops",
    description:
      "Business-class 1.08kg ultrabook with the legendary ThinkPad keyboard and MIL-SPEC durability.",
    basePrice: 169990,
    images: ["https://placehold.co/800x800/111/fff?text=X1+Carbon"],
    variants: [
      { name: "Black / 16GB+512GB", priceDiff: 0, stock: 5 },
      { name: "Black / 32GB+1TB", priceDiff: 28000, stock: 2 },
    ],
  },
  {
    name: "ASUS ROG Zephyrus G14",
    slug: "rog-zephyrus-g14",
    category: "gaming-laptops",
    description:
      "14-inch gaming powerhouse: Ryzen 9, RTX 4060 and a 165Hz ROG Nebula display in a 1.65kg body.",
    basePrice: 149990,
    featured: true,
    images: ["https://placehold.co/800x800/111/fff?text=ROG+Zephyrus+G14"],
    variants: [
      { name: "Moonlight White / RTX 4060 / 1TB", priceDiff: 0, stock: 8 },
      { name: "Moonlight White / RTX 4070 / 1TB", priceDiff: 30000, stock: 3 },
    ],
  },
  {
    name: "HP Spectre x360 14",
    slug: "hp-spectre-x360",
    category: "laptops",
    description:
      "2-in-1 convertible with an OLED touch display, Intel Core Ultra 7 and a 9MP IR webcam.",
    basePrice: 139990,
    images: ["https://placehold.co/800x800/111/fff?text=Spectre+x360"],
    variants: [
      { name: "Nocturne Blue / 16GB+1TB", priceDiff: 0, stock: 4 },
      { name: "Poseidon Blue / 32GB+1TB", priceDiff: 20000, stock: 1 },
    ],
  },
  {
    name: "Sony WH-1000XM5",
    slug: "sony-wh-1000xm5",
    category: "headphones",
    description:
      "Industry-leading noise cancelling, 30-hour battery and crystal-clear call quality with the V1 processor.",
    basePrice: 29990,
    featured: true,
    images: ["https://placehold.co/800x800/111/fff?text=WH-1000XM5"],
    variants: [
      { name: "Black", priceDiff: 0, stock: 18 },
      { name: "Silver", priceDiff: 0, stock: 7 },
    ],
  },
  {
    name: "Sennheiser HD 650",
    slug: "sennheiser-hd-650",
    category: "headphones",
    description:
      "Audiophile open-back reference headphones with a warm, natural sound signature.",
    basePrice: 38990,
    images: ["https://placehold.co/800x800/111/fff?text=HD+650"],
    variants: [{ name: "Matte Black", priceDiff: 0, stock: 9 }],
  },
  {
    name: "Bose QuietComfort Ultra",
    slug: "bose-qc-ultra",
    category: "headphones",
    description:
      "Bose Immersive Audio, world-class ANC and spatial sound in a premium over-ear package.",
    basePrice: 39900,
    images: ["https://placehold.co/800x800/111/fff?text=QC+Ultra"],
    variants: [
      { name: "Black", priceDiff: 0, stock: 6 },
      { name: "White Smoke", priceDiff: 0, stock: 0 },
    ],
  },
  {
    name: "Apple AirPods Pro 2 (USB-C)",
    slug: "airpods-pro-2",
    category: "earbuds",
    description:
      "Twice the active noise cancellation, Adaptive Audio and a USB-C MagSafe charging case.",
    basePrice: 24900,
    featured: true,
    images: ["https://placehold.co/800x800/111/fff?text=AirPods+Pro+2"],
    variants: [{ name: "White", priceDiff: 0, stock: 22 }],
  },
  {
    name: "Samsung Galaxy Buds 2 Pro",
    slug: "galaxy-buds-2-pro",
    category: "earbuds",
    description:
      "Hi-Fi 24-bit audio with intelligent ANC and a comfortable, secure in-ear fit.",
    basePrice: 19999,
    images: ["https://placehold.co/800x800/111/fff?text=Buds+2+Pro"],
    variants: [
      { name: "Graphite", priceDiff: 0, stock: 13 },
      { name: "Bora Purple", priceDiff: 0, stock: 5 },
    ],
  },
  {
    name: "Nothing Ear (2)",
    slug: "nothing-ear-2",
    category: "earbuds",
    description:
      "Transparent-design earbuds with dual-chamber acoustics, active noise cancellation and LDAC support.",
    basePrice: 14999,
    images: ["https://placehold.co/800x800/111/fff?text=Nothing+Ear+2"],
    variants: [{ name: "White", priceDiff: 0, stock: 16 }],
  },
  {
    name: "JBL Flip 6",
    slug: "jbl-flip-6",
    category: "speakers",
    description:
      "Punchy portable Bluetooth speaker with deep bass, IP67 waterproofing and 12-hour playtime.",
    basePrice: 11999,
    images: ["https://placehold.co/800x800/111/fff?text=JBL+Flip+6"],
    variants: [
      { name: "Black", priceDiff: 0, stock: 19 },
      { name: "Red", priceDiff: 0, stock: 4 },
      { name: "Squad", priceDiff: 1000, stock: 0 },
    ],
  },
  {
    name: "Sonos One (Gen 2)",
    slug: "sonos-one-gen2",
    category: "speakers",
    description:
      "Smart speaker with rich room-filling sound, Voice control and Apple AirPlay 2 support.",
    basePrice: 23999,
    images: ["https://placehold.co/800x800/111/fff?text=Sonos+One"],
    variants: [
      { name: "Black", priceDiff: 0, stock: 8 },
      { name: "White", priceDiff: 0, stock: 6 },
    ],
  },
  {
    name: "Anker Soundcore Q30",
    slug: "soundcore-q30",
    category: "headphones",
    description:
      "Budget-friendly ANC headphones with 40-hour playtime and Hi-Res certified audio.",
    basePrice: 5999,
    images: ["https://placehold.co/800x800/111/fff?text=Soundcore+Q30"],
    variants: [{ name: "Black", priceDiff: 0, stock: 30 }],
  },
  {
    name: "Anker 65W GaN Charger",
    slug: "anker-65w-gan",
    category: "chargers-cables",
    description:
      "Two-port USB-C GaN wall charger that powers a laptop and phone simultaneously in a pocketable size.",
    basePrice: 2999,
    featured: true,
    images: ["https://placehold.co/800x800/111/fff?text=GaN+65W"],
    variants: [{ name: "Black", priceDiff: 0, stock: 40 }],
  },
  {
    name: "Apple 20W USB-C Power Adapter",
    slug: "apple-20w-adapter",
    category: "chargers-cables",
    description:
      "Fast charging for iPhone and iPad with USB-C. Compact and travel friendly.",
    basePrice: 1999,
    images: ["https://placehold.co/800x800/111/fff?text=Apple+20W"],
    variants: [{ name: "White", priceDiff: 0, stock: 35 }],
  },
  {
    name: "Anker USB-C to USB-C Cable (240W)",
    slug: "anker-usb-c-240w",
    category: "chargers-cables",
    description:
      "2m braided cable supporting 240W charging, USB 2.0 data and E-marker certification.",
    basePrice: 1499,
    images: ["https://placehold.co/800x800/111/fff?text=USB-C+240W"],
    variants: [
      { name: "Black / 2m", priceDiff: 0, stock: 50 },
      { name: "Blue / 2m", priceDiff: 0, stock: 12 },
    ],
  },
  {
    name: "Spigen Ultra Hybrid iPhone Case",
    slug: "spigen-ultra-hybrid",
    category: "cases-protection",
    description:
      "Crystal-clear back with a tough bumper frame, Mil-Grade drop protection and anti-yellowing coating.",
    basePrice: 1999,
    images: ["https://placehold.co/800x800/111/fff?text=Ultra+Hybrid"],
    variants: [
      { name: "Clear / iPhone 15 Pro", priceDiff: 0, stock: 27 },
      { name: "Matte Black / iPhone 15 Pro", priceDiff: 0, stock: 9 },
      { name: "Clear / iPhone 15", priceDiff: 0, stock: 14 },
    ],
  },
  {
    name: "Samsung 25W Super Fast Charger",
    slug: "samsung-25w-charger",
    category: "chargers-cables",
    description:
      "Compact USB-C fast charger for Galaxy devices. Includes 1.2m Type-C cable.",
    basePrice: 2499,
    images: ["https://placehold.co/800x800/111/fff?text=Samsung+25W"],
    variants: [{ name: "Black", priceDiff: 0, stock: 18 }],
  },
];

const USERS = [
  {
    email: "admin@unboxd.com",
    password: "Admin@123",
    name: "Admin",
    role: "admin" as const,
  },
  {
    email: "customer1@unboxd.com",
    password: "Customer@123",
    name: "Priya Sharma",
  },
  {
    email: "customer2@unboxd.com",
    password: "Customer@123",
    name: "Rahul Verma",
  },
];

const WISHLIST_PRODUCT_SLUGS = [
  "iphone-15-pro",
  "sony-wh-1000xm5",
  "anker-65w-gan",
];

async function seedCatalog() {
  const [existingProducts, existingCategories] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
  ]);
  if (existingProducts > 0 || existingCategories > 0) {
    console.log(
      `Catalog seed skipped: ${existingProducts} products, ${existingCategories} categories already exist. ` +
        "Reset the database (bunx prisma migrate reset) before re-seeding.",
    );
    return;
  }

  for (const c of categories) {
    await prisma.category.create({
      data: {
        name: c.name,
        slug: c.slug,
        ...(c.parent ? { parent: { connect: { slug: c.parent } } } : {}),
      },
    });
  }

  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        basePrice: p.basePrice,
        featured: p.featured ?? false,
        category: { connect: { slug: p.category } },
        images: {
          create: p.images.map((url, i) => ({
            url,
            alt: p.name,
            sortOrder: i,
          })),
        },
        variants: {
          create: p.variants.map((v) => ({
            name: v.name,
            sku: `${p.slug}-${v.name
              .replace(/[^a-zA-Z0-9]+/g, "-")
              .toLowerCase()
              .slice(0, 24)}`,
            priceDiff: v.priceDiff,
            stock: v.stock,
          })),
        },
      },
    });
    console.log(`Seeded: ${product.name}`);
  }

  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    images: await prisma.productImage.count(),
  };
  console.log("Catalog seed complete:", counts);
}

async function seedUsers() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log(`User seed skipped: ${existing} users already exist.`);
    return;
  }

  for (const user of USERS) {
    const created = await auth.api.signUpEmail({
      body: {
        email: user.email,
        password: user.password,
        name: user.name,
      },
    });
    if (user.role === "admin") {
      await prisma.user.update({
        where: { id: created.user.id },
        data: { role: "admin" },
      });
    }
  }

  const customer1 = await prisma.user.findUnique({
    where: { email: "customer1@unboxd.com" },
  });
  const wishlistProducts = await prisma.product.findMany({
    where: { slug: { in: WISHLIST_PRODUCT_SLUGS } },
  });
  if (customer1 && wishlistProducts.length > 0) {
    await prisma.wishlistItem.createMany({
      data: wishlistProducts.map((product) => ({
        userId: customer1.id,
        productId: product.id,
      })),
    });
  }

  console.log(
    `User seed complete: 1 admin, ${USERS.length - 1} customers, ` +
      `${wishlistProducts.length} wishlist rows. ` +
      "Credentials (dev only): admin@unboxd.com / Admin@123, customer1@unboxd.com / Customer@123.",
  );
}

async function main() {
  await seedCatalog();
  await seedUsers();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
