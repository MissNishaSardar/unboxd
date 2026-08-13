import { cacheLife } from "next/cache";
import { cacheTag } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/dbClient/prisma";
import { productSortSchema } from "@/lib/zodSchema";

export const PRODUCTS_PER_PAGE = 12;

export async function getFeaturedProducts() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const products = await prisma.product.findMany({
    where: { isActive: true, featured: true },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
  });
  return products.map((product) => ({
    slug: product.slug,
    name: product.name,
    basePrice: String(product.basePrice),
    category: { name: product.category.name, slug: product.category.slug },
    images: product.images.map((image) => ({ url: image.url, alt: image.alt })),
  }));
}

export async function getCategoriesWithCounts() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
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
  category?: string;
  sort?: z.infer<typeof productSortSchema>;
  min?: number;
  max?: number;
  page?: number;
};

export async function getProducts(params: ProductListParams) {
  const { category, sort = "newest", min, max, page = 1 } = params;
  const where = {
    isActive: true,
    ...(category && { category: { slug: category } }),
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
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((product) => ({
      slug: product.slug,
      name: product.name,
      basePrice: String(product.basePrice),
      category: { name: product.category.name, slug: product.category.slug },
      images: product.images.map((image) => ({
        url: image.url,
        alt: image.alt,
      })),
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)),
  };
}
