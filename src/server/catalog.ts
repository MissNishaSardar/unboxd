import { cacheLife } from "next/cache";
import { cacheTag } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/dbClient/prisma";
import { resolveProductImageUrl } from "@/lib/placeholder";
import { productSortSchema } from "@/lib/zodSchema";

export const PRODUCTS_PER_PAGE = 12;

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  basePrice: { toString(): string };
  brand: string;
  brandSlug: string;
  category: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
  variants: {
    sku: string;
    name: string;
    priceDiff: { toString(): string };
    stock: number;
  }[];
};

export function toProductCardData(product: ProductRow) {
  const defaultVariant =
    product.variants.find((variant) => variant.stock > 0) ??
    product.variants[0];
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    basePrice: String(product.basePrice),
    brand: product.brand,
    brandSlug: product.brandSlug,
    category: { name: product.category.name, slug: product.category.slug },
    images: product.images.map((image, index) => ({
      url: resolveProductImageUrl(image.url, product.slug, index),
      alt: image.alt,
    })),
    defaultVariant:
      defaultVariant ?
        {
          sku: defaultVariant.sku,
          name: defaultVariant.name,
          priceDiff: String(defaultVariant.priceDiff),
          stock: defaultVariant.stock,
        }
      : null,
  };
}

export const productCardInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  category: true,
  variants: { orderBy: { priceDiff: "asc" } },
} as const;

export async function getFeaturedProducts() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const products = await prisma.product.findMany({
    where: { isActive: true, featured: true },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: productCardInclude,
  });
  return products.map(toProductCardData);
}

export async function getCategoriesWithCounts(params?: {
  q?: string;
  brands?: string[];
  categories?: string[];
  min?: number;
  max?: number;
}) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const trimmedQ = params?.q?.trim();
  const whereProducts: Record<string, unknown> = { isActive: true };
  if (trimmedQ) {
    (whereProducts as Record<string, unknown>).OR = [
      { name: { contains: trimmedQ } },
      { description: { contains: trimmedQ } },
    ];
  }
  if (params?.brands && params.brands.length > 0) {
    (whereProducts as Record<string, unknown>).brandSlug = {
      in: params.brands,
    };
  }
  if (params?.categories && params.categories.length > 0) {
    (whereProducts as Record<string, unknown>).category = {
      slug: { in: params.categories },
      deletedAt: null,
    };
  }
  if (params?.min !== undefined || params?.max !== undefined) {
    (whereProducts as Record<string, unknown>).basePrice = {
      gte: params?.min,
      lte: params?.max,
    };
  }
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          products: { where: whereProducts as never },
        },
      },
    },
  });
  return categories
    .filter((category) => category._count.products > 0)
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      count: category._count.products,
    }));
}

export type ProductListParams = {
  q?: string;
  categories?: string[];
  brands?: string[];
  sort?: z.infer<typeof productSortSchema>;
  min?: number;
  max?: number;
  page?: number;
};

export async function getProducts(params: ProductListParams) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const {
    q,
    categories = [],
    brands = [],
    sort = "newest",
    min,
    max,
    page = 1,
  } = params;
  const trimmedQ = q?.trim();
  const where = {
    isActive: true,
    ...(trimmedQ && {
      OR: [
        { name: { contains: trimmedQ } },
        { description: { contains: trimmedQ } },
      ],
    }),
    ...(categories.length && {
      category: { slug: { in: categories }, deletedAt: null },
    }),
    ...(brands.length && {
      brandSlug: { in: brands },
    }),
    ...((min !== undefined || max !== undefined) && {
      basePrice: {
        gte: min,
        lte: max,
      },
    }),
  };
  const orderBy = {
    price_asc: { basePrice: "asc" as const },
    price_desc: { basePrice: "desc" as const },
    newest: [{ createdAt: "desc" as const }, { id: "asc" as const }],
  }[sort];

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
      include: productCardInclude,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map(toProductCardData),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)),
  };
}

export async function getProductSlugs() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return products.map((product) => product.slug);
}

export type ProductDetailVariant = {
  sku: string;
  name: string;
  priceDiff: string;
  stock: number;
};

export type ProductDetailData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  basePrice: string;
  brand: string;
  brandSlug: string;
  priceFrom: string;
  category: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
  variants: ProductDetailVariant[];
};

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: productCardInclude,
  });
  if (!product) return null;
  return toProductDetailData(product);
}

export async function getRelatedProducts(slug: string, categorySlug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      slug: { not: slug },
      category: { slug: categorySlug, deletedAt: null },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 4,
    include: productCardInclude,
  });
  return products.map(toProductCardData);
}

function toProductDetailData(product: {
  id: string;
  slug: string;
  name: string;
  description: string;
  basePrice: { toString(): string };
  brand: string;
  brandSlug: string;
  category: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
  variants: {
    sku: string;
    name: string;
    priceDiff: { toString(): string };
    stock: number;
  }[];
}): ProductDetailData {
  const variants = product.variants.map((variant) => ({
    sku: variant.sku,
    name: variant.name,
    priceDiff: String(variant.priceDiff),
    stock: variant.stock,
  }));
  const priceFrom =
    variants.length > 0 ?
      String(
        Math.min(
          ...variants.map(
            (variant) => Number(product.basePrice) + Number(variant.priceDiff),
          ),
        ),
      )
    : String(product.basePrice);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    basePrice: String(product.basePrice),
    brand: product.brand,
    brandSlug: product.brandSlug,
    priceFrom,
    category: { name: product.category.name, slug: product.category.slug },
    images: product.images.map((image, index) => ({
      url: resolveProductImageUrl(image.url, product.slug, index),
      alt: image.alt,
    })),
    variants,
  };
}
