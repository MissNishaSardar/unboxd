import prisma from "@/lib/dbClient/prisma";
import { adminProductListSearchParamsType } from "@/lib/zodSchema";
import { startOfWeek } from "date-fns";

export const ADMIN_PRODUCTS_PER_PAGE = 10;
export const ADMIN_USERS_PER_PAGE = 10;
export const LOW_STOCK_THRESHOLD = 5;

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
    description: product.description,
    basePrice: String(product.basePrice),
    categoryId: product.categoryId,
    isActive: product.isActive,
    categoryName: product.category.name,
    images: product.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
    variants: product.variants.map((variant) => ({
      name: variant.name,
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

export type AdminCategoryNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  productCount: number;
  children: AdminCategoryNode[];
};

export async function getAdminCategoryTree(): Promise<AdminCategoryNode[]> {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const nodes = new Map<string, AdminCategoryNode>();
  for (const category of categories) {
    nodes.set(category.id, {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      productCount: category._count.products,
      children: [],
    });
  }

  const roots: AdminCategoryNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export async function getAdminCategoryForEdit(id: string) {
  const category = await prisma.category.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, name: true, parentId: true },
  });
  return category;
}

export async function getAdminCategoryOptions() {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, parentId: true },
  });
  return categories;
}

export async function getInventoryLowStock() {
  const variants = await prisma.productVariant.findMany({
    where: { stock: { lt: LOW_STOCK_THRESHOLD } },
    include: {
      product: {
        select: { id: true, name: true, slug: true, isActive: true },
      },
    },
    orderBy: [{ stock: "asc" }, { product: { name: "asc" } }],
  });

  return variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    name: variant.name,
    stock: variant.stock,
    productId: variant.product.id,
    productName: variant.product.name,
    productSlug: variant.product.slug,
    isActive: variant.product.isActive,
  }));
}

export async function getSalesSummary() {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const [totalOrders, weekOrders, weekAggregate] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: weekStart } },
      _sum: { total: true },
    }),
  ]);

  return {
    totalOrders,
    weekOrders,
    weekRevenue: String(weekAggregate._sum.total ?? 0),
  };
}

export async function getAdminUsers(params: {
  search?: string;
  role?: string;
  page?: number;
}) {
  const { search, role = "all", page = 1 } = params;
  const limit = ADMIN_USERS_PER_PAGE;
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {
    deletedAt: null,
    ...(search ?
      {
        OR: [{ name: { contains: search } }, { email: { contains: search } }],
      }
    : {}),
    ...(role !== "all" ? { role } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
        deletedAt: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where: where as never }),
  ]);

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role ?? "user",
      banned: user.banned ?? false,
      banReason: user.banReason ?? null,
      banExpires: user.banExpires ? user.banExpires.toISOString() : null,
      deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
