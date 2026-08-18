import prisma from "@/lib/dbClient/prisma";
import { adminProductListSearchParamsType } from "@/lib/zodSchema";

export const ADMIN_PRODUCTS_PER_PAGE = 10;

const productOrderByMap: Record<
  adminProductListSearchParamsType["sort"],
  object
> = {
  newest: [{ createdAt: "desc" }, { id: "asc" }],
  oldest: [{ createdAt: "asc" }, { id: "asc" }],
  price_asc: { basePrice: "asc" },
  price_desc: { basePrice: "desc" },
  name_asc: { name: "asc" },
};

export async function getAdminProducts(
  params: Pick<
    adminProductListSearchParamsType,
    "search" | "sort" | "status" | "page"
  >,
) {
  const { search, sort = "newest", status = "all", page = 1 } = params;

  const where = {
    ...(status === "active" && { isActive: true }),
    ...(status === "inactive" && { isActive: false }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { slug: { contains: search } },
        { variants: { some: { sku: { contains: search } } } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: productOrderByMap[sort],
      skip: (page - 1) * ADMIN_PRODUCTS_PER_PAGE,
      take: ADMIN_PRODUCTS_PER_PAGE,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { name: true } },
        variants: { select: { stock: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      basePrice: String(product.basePrice),
      isActive: product.isActive,
      featured: product.featured,
      categoryName: product.category.name,
      imageUrl: product.images[0]?.url ?? null,
      totalStock: product.variants.reduce(
        (sum, variant) => sum + variant.stock,
        0,
      ),
      variantCount: product.variants.length,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_PRODUCTS_PER_PAGE)),
  };
}

export async function getAdminProductForEdit(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { priceDiff: "asc" } },
    },
  });
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: String(product.basePrice),
    categoryId: product.categoryId,
    isActive: product.isActive,
    featured: product.featured,
    categoryName: product.category.name,
    images: product.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
    variants: product.variants.map((variant) => ({
      sku: variant.sku,
      name: variant.name,
      priceDiff: variant.priceDiff.toString(),
      stock: variant.stock,
    })),
  };
}

export async function getAdminCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return categories;
}
