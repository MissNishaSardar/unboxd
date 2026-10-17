import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/dbClient/prisma";
import { resolveProductImageUrl } from "@/lib/placeholder";
import {
  activeDiscountPercent,
  combineDiscountPercent,
  effectivePrice,
  mrp,
} from "@/lib/pricing";
import { getActiveSalePercent } from "@/server/deals";
import { productSortSchema } from "@/lib/zodSchema";

export const PRODUCTS_PER_PAGE = 12;

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  basePrice: { toString(): string };
  discountPercent: number;
  discountStartsAt: Date | string | null;
  discountEndsAt: Date | string | null;
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

export function toProductCardData(product: ProductRow, globalPercent = 0) {
  const defaultVariant =
    product.variants.find((variant) => variant.stock > 0) ??
    product.variants[0];
  const own = activeDiscountPercent(
    {
      discountPercent: product.discountPercent ?? 0,
      discountStartsAt: product.discountStartsAt,
      discountEndsAt: product.discountEndsAt,
    },
    Date.now(),
  );
  const discountPercent = combineDiscountPercent(own, globalPercent);
  const base = Number(product.basePrice);
  const diff = defaultVariant ? Number(defaultVariant.priceDiff) : 0;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    basePrice: String(product.basePrice),
    discountPercent,
    price: effectivePrice(base, diff, discountPercent),
    mrp: mrp(base, diff),
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

function toPlainProductRow(row: ProductRow & { description?: string }) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    basePrice: String(row.basePrice),
    discountPercent: row.discountPercent ?? 0,
    discountStartsAt:
      row.discountStartsAt instanceof Date ?
        row.discountStartsAt.toISOString()
      : (row.discountStartsAt ?? null),
    discountEndsAt:
      row.discountEndsAt instanceof Date ?
        row.discountEndsAt.toISOString()
      : (row.discountEndsAt ?? null),
    brand: row.brand,
    brandSlug: row.brandSlug,
    category: { name: row.category.name, slug: row.category.slug },
    images: row.images.map((image) => ({ url: image.url, alt: image.alt })),
    variants: row.variants.map((variant) => ({
      sku: variant.sku,
      name: variant.name,
      priceDiff: String(variant.priceDiff),
      stock: variant.stock,
    })),
  };
}

async function mapWithSale<T extends ProductRow>(rows: T[]) {
  const salePercent = await getActiveSalePercent();
  return rows.map((row) => toProductCardData(row, salePercent));
}

export async function getFeaturedProducts() {
  const rows = await getFeaturedProductRows();
  return mapWithSale(rows);
}

async function getFeaturedProductRows() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const products = await prisma.product.findMany({
    where: { isActive: true, featured: true },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: productCardInclude,
  });
  return products.map(toPlainProductRow);
}

const TOP_RATED_MIN_REVIEWS = 2;

export async function getTopRatedProducts(limit = 10) {
  const ordered = await getTopRatedProductRows(limit);
  const top = await mapWithSale(ordered);
  if (top.length >= limit) return top;
  const seen = new Set(top.map((product) => product.id));
  const fallbackRows = (await getFeaturedProductRows()).filter(
    (product) => !seen.has(product.id),
  );
  const fallback = await mapWithSale(fallbackRows);
  return [...top, ...fallback].slice(0, limit);
}

async function getTopRatedProductRows(limit: number) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  cacheTag("reviews");
  const groups = await prisma.review.groupBy({
    by: ["productId"],
    where: { product: { isActive: true } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const ranked = groups
    .filter(
      (group) =>
        (group._count.rating ?? 0) >= TOP_RATED_MIN_REVIEWS &&
        (group._avg.rating ?? 0) > 0,
    )
    .sort(
      (a, b) =>
        (b._avg.rating ?? 0) - (a._avg.rating ?? 0) ||
        (b._count.rating ?? 0) - (a._count.rating ?? 0),
    )
    .slice(0, limit);
  const ids = ranked.map((group) => group.productId);
  const products =
    ids.length > 0 ?
      await prisma.product.findMany({
        where: { id: { in: ids }, isActive: true },
        include: productCardInclude,
      })
    : [];
  const byId = new Map(products.map((product) => [product.id, product]));
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((product): product is (typeof products)[number] => Boolean(product))
    .map(toPlainProductRow);
  if (ordered.length >= limit) return ordered;
  const seen = new Set(ordered.map((product) => product.id));
  const fallbackRows = await prisma.product.findMany({
    where: { isActive: true, featured: true },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: productCardInclude,
  });
  return [
    ...ordered,
    ...fallbackRows.map(toPlainProductRow).filter((p) => !seen.has(p.id)),
  ].slice(0, limit);
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
    orderBy: [{ position: "asc" }, { name: "asc" }, { id: "asc" }],
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
  const rows = await getProductRows(params);
  return {
    products: await mapWithSale(rows.products),
    total: rows.total,
    page: rows.page,
    totalPages: rows.totalPages,
  };
}

async function getProductRows(params: ProductListParams) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  cacheTag("reviews");
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
  if (sort === "rating_desc" || sort === "rating_asc") {
    const matching = await prisma.product.findMany({
      where,
      select: { id: true, slug: true },
    });
    const total = matching.length;
    if (total === 0) {
      return {
        products: [],
        total: 0,
        page,
        totalPages: 1,
      };
    }
    const ids = matching.map((m) => m.id);
    const slugById = new Map(matching.map((m) => [m.id, m.slug] as const));
    const groups = await prisma.review.groupBy({
      by: ["productId"],
      where: { productId: { in: ids } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const avgById = new Map<string, number | null>();
    const countById = new Map<string, number>();
    for (const g of groups) {
      const avg = (g as unknown as { _avg: { rating: number | null } })._avg
        .rating;
      const count = (g as unknown as { _count: { _all: number } })._count._all;
      avgById.set(g.productId, avg);
      countById.set(g.productId, count);
    }
    const effectiveRating = new Map<string, number>();
    const effectiveCount = new Map<string, number>(countById);
    for (const m of matching) {
      const realAvg = avgById.get(m.id);
      if (realAvg != null) {
        effectiveRating.set(m.id, Math.round(realAvg * 10) / 10);
      } else {
        effectiveRating.set(m.id, 0);
        effectiveCount.set(m.id, 0);
      }
    }
    const sortedIds = [...ids].sort((a, b) => {
      const aR = effectiveRating.get(a)!;
      const bR = effectiveRating.get(b)!;
      if (aR !== bR) {
        return sort === "rating_desc" ? bR - aR : aR - bR;
      }
      const aC = effectiveCount.get(a) ?? 0;
      const bC = effectiveCount.get(b) ?? 0;
      if (aC !== bC) return bC - aC;
      const aSlug = slugById.get(a)!;
      const bSlug = slugById.get(b)!;
      return aSlug.localeCompare(bSlug);
    });
    const start = (page - 1) * PRODUCTS_PER_PAGE;
    const pagedIds = sortedIds.slice(start, start + PRODUCTS_PER_PAGE);
    if (pagedIds.length === 0) {
      return {
        products: [],
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)),
      };
    }
    const products = await prisma.product.findMany({
      where: { id: { in: pagedIds } },
      include: productCardInclude,
    });
    const productsById = new Map(products.map((p) => [p.id, p] as const));
    const ordered = pagedIds
      .map((id) => productsById.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map(toPlainProductRow);
    return {
      products: ordered,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)),
    };
  }

  const orderBy = {
    price_asc: { basePrice: "asc" as const },
    price_desc: { basePrice: "desc" as const },
    newest: [{ createdAt: "desc" as const }, { id: "asc" as const }],
  }[sort as "price_asc" | "price_desc" | "newest"];

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
    products: products.map(toPlainProductRow),
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
  discountPercent: number;
  brand: string;
  brandSlug: string;
  priceFrom: string;
  mrpFrom: string;
  category: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
  variants: ProductDetailVariant[];
};

export async function getProductBySlug(slug: string) {
  const product = await getProductRowBySlug(slug);
  if (!product) return null;
  const salePercent = await getActiveSalePercent();
  return toProductDetailData(product, salePercent);
}

async function getProductRowBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: productCardInclude,
  });
  return product ? toPlainProductRow(product) : null;
}

export async function getRelatedProducts(slug: string, categorySlug: string) {
  const rows = await getRelatedProductRows(slug, categorySlug);
  return mapWithSale(rows);
}

async function getRelatedProductRows(slug: string, categorySlug: string) {
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
  return products.map(toPlainProductRow);
}

function toProductDetailData(
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    basePrice: { toString(): string };
    discountPercent: number;
    discountStartsAt: Date | string | null;
    discountEndsAt: Date | string | null;
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
  },
  globalPercent = 0,
): ProductDetailData {
  const variants = product.variants.map((variant) => ({
    sku: variant.sku,
    name: variant.name,
    priceDiff: String(variant.priceDiff),
    stock: variant.stock,
  }));
  const discountPercent = combineDiscountPercent(
    activeDiscountPercent(
      {
        discountPercent: product.discountPercent ?? 0,
        discountStartsAt: product.discountStartsAt,
        discountEndsAt: product.discountEndsAt,
      },
      Date.now(),
    ),
    globalPercent,
  );
  const base = Number(product.basePrice);
  const mrps = variants.map((variant) => base + Number(variant.priceDiff));
  const mrpFromValue = variants.length > 0 ? Math.min(...mrps) : base;
  const priceFrom =
    variants.length > 0 ?
      String(
        Math.min(
          ...variants.map((variant) =>
            effectivePrice(base, Number(variant.priceDiff), discountPercent),
          ),
        ),
      )
    : String(effectivePrice(base, 0, discountPercent));
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    basePrice: String(product.basePrice),
    discountPercent,
    brand: product.brand,
    brandSlug: product.brandSlug,
    priceFrom,
    mrpFrom: String(mrpFromValue),
    category: { name: product.category.name, slug: product.category.slug },
    images: product.images.map((image, index) => ({
      url: resolveProductImageUrl(image.url, product.slug, index),
      alt: image.alt,
    })),
    variants,
  };
}
