import prisma from "@/lib/dbClient/prisma";
import { DAY_MS } from "@/lib/constants";
import {
  getPlaceholderPhotoUrl,
  resolveProductImageUrl,
} from "@/lib/placeholder";
import { adminProductListSearchParamsType } from "@/lib/zodSchema";
import { format, startOfWeek, startOfDay, subDays } from "date-fns";
import { getStoreSettings } from "@/server/admin/settings";

export const ADMIN_PRODUCTS_PER_PAGE = 10;
export const ADMIN_USERS_PER_PAGE = 10;

const productOrderByMap: Record<
  adminProductListSearchParamsType["sort"],
  object
> = {
  newest: [{ createdAt: "desc" }, { id: "asc" }],
  oldest: [{ createdAt: "asc" }, { id: "asc" }],
  price_asc: [{ basePrice: "asc" }, { id: "asc" }],
  price_desc: [{ basePrice: "desc" }, { id: "asc" }],
  name_asc: [{ name: "asc" }, { id: "asc" }],
  name_desc: [{ name: "desc" }, { id: "asc" }],
};

export async function getAdminProducts(
  params: Pick<
    adminProductListSearchParamsType,
    "search" | "sort" | "status" | "stock" | "page"
  >,
) {
  const {
    search,
    sort = "newest",
    status = "all",
    stock = "all",
    page = 1,
  } = params;

  const { lowStockThreshold } = await getStoreSettings();

  const where = {
    ...(status === "active" && { isActive: true }),
    ...(status === "inactive" && { isActive: false }),
    ...(stock === "low" && {
      variants: { some: { stock: { gt: 0, lt: lowStockThreshold } } },
    }),
    ...(stock === "out" && { variants: { some: { stock: 0 } } }),
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
        variants: { select: { id: true, name: true, sku: true, stock: true } },
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
      discountPercent: product.discountPercent,
      discountStartsAt:
        product.discountStartsAt ?
          product.discountStartsAt.toISOString()
        : null,
      discountEndsAt:
        product.discountEndsAt ? product.discountEndsAt.toISOString() : null,
      isActive: product.isActive,
      featured: product.featured,
      categoryName: product.category.name,
      createdAt: product.createdAt.toISOString(),
      imageUrl:
        product.images[0] ?
          resolveProductImageUrl(product.images[0].url, product.slug, 0)
        : getPlaceholderPhotoUrl(product.slug),
      totalStock: product.variants.reduce(
        (sum, variant) => sum + variant.stock,
        0,
      ),
      variantCount: product.variants.length,
      flaggedVariants:
        stock === "out" ?
          product.variants
            .filter((variant) => variant.stock === 0)
            .map((variant) => ({
              id: variant.id,
              name: variant.name,
              sku: variant.sku,
              stock: variant.stock,
            }))
        : stock === "low" ?
          product.variants
            .filter(
              (variant) =>
                variant.stock > 0 && variant.stock < lowStockThreshold,
            )
            .map((variant) => ({
              id: variant.id,
              name: variant.name,
              sku: variant.sku,
              stock: variant.stock,
            }))
        : [],
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
    discountPercent: product.discountPercent,
    discountStartsAt:
      product.discountStartsAt ? product.discountStartsAt.toISOString() : null,
    discountEndsAt:
      product.discountEndsAt ? product.discountEndsAt.toISOString() : null,
    brand: product.brand,
    categoryId: product.categoryId,
    isActive: product.isActive,
    categoryName: product.category.name,
    images: product.images.map((image) => ({
      url: resolveProductImageUrl(image.url, product.slug, image.sortOrder),
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

export async function getAdminAttention() {
  const { lowStockThreshold, returnWindowDays } = await getStoreSettings();
  const returnCutoff = new Date(Date.now() - returnWindowDays * DAY_MS);
  const [awaitingShipment, inTransit, returned, deliveredEligible, lowStock] =
    await Promise.all([
      prisma.order.count({ where: { status: "CONFIRMED" } }),
      prisma.order.count({ where: { status: "SHIPPED" } }),
      prisma.order.count({ where: { status: "RETURNED" } }),
      prisma.order.count({
        where: { status: "DELIVERED", statusUpdatedAt: { gte: returnCutoff } },
      }),
      prisma.product.count({
        where: {
          variants: { some: { stock: { gt: 0, lt: lowStockThreshold } } },
        },
      }),
    ]);

  return {
    awaitingShipment,
    inTransit,
    returned,
    deliveredEligible,
    lowStock,
  };
}

export async function getAdminTotals() {
  const [totalProducts, totalOrders, totalCategories, totalUsers] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.category.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
    ]);

  return {
    totalProducts,
    totalOrders,
    totalCategories,
    totalUsers,
  };
}

export async function getAdminUsers(params: {
  search?: string;
  role?: string;
  sort?: string;
  page?: number;
}) {
  const { search, role = "all", sort = "joined_desc", page = 1 } = params;
  const limit = ADMIN_USERS_PER_PAGE;
  const offset = (page - 1) * limit;

  const orderBy =
    sort === "name_asc" ? [{ name: "asc" }, { id: "asc" }]
    : sort === "name_desc" ? [{ name: "desc" }, { id: "asc" }]
    : sort === "email_asc" ? [{ email: "asc" }, { id: "asc" }]
    : sort === "email_desc" ? [{ email: "desc" }, { id: "asc" }]
    : sort === "joined_asc" ? [{ createdAt: "asc" }, { id: "asc" }]
    : [{ createdAt: "desc" }, { id: "asc" }];

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
      orderBy: orderBy as never,
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

export async function getRecentOrders(limit = 7) {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: String(order.total),
    createdAt: order.createdAt.toISOString(),
    customerName: order.user.name || order.user.email,
    itemCount: order._count.items,
  }));
}

export async function getRevenueTrend(days = 14) {
  const now = new Date();
  const start = startOfDay(subDays(now, days - 1));

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start },
      status: { notIn: ["CANCELLED", "RETURNED"] },
    },
    select: { createdAt: true, total: true },
  });

  const buckets = new Map<string, { orders: number; revenue: number }>();
  for (let i = 0; i < days; i += 1) {
    const day = startOfDay(subDays(now, days - 1 - i));
    buckets.set(format(day, "yyyy-MM-dd"), { orders: 0, revenue: 0 });
  }

  for (const order of orders) {
    const key = format(order.createdAt, "yyyy-MM-dd");
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.orders += 1;
      bucket.revenue += Number(order.total);
    }
  }

  const timeline = [...buckets.entries()].map(([date, value]) => ({
    date,
    label: format(new Date(`${date}T00:00:00`), "d MMM"),
    orders: value.orders,
    revenue: String(Math.round(value.revenue * 100) / 100),
  }));

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  return {
    days: timeline,
    totalOrders: orders.length,
    totalRevenue: String(Math.round(totalRevenue * 100) / 100),
  };
}

export async function getTopProducts(limit = 5) {
  const items = await prisma.orderItem.findMany({
    where: { order: { status: { notIn: ["CANCELLED", "RETURNED"] } } },
    select: {
      productId: true,
      quantity: true,
      priceSnapshot: true,
      nameSnapshot: true,
    },
    take: 2000,
  });

  const byProduct = new Map<
    string,
    { units: number; revenue: number; name: string }
  >();
  for (const item of items) {
    const existing = byProduct.get(item.productId) ?? {
      units: 0,
      revenue: 0,
      name: item.nameSnapshot,
    };
    existing.units += item.quantity;
    existing.revenue += Number(item.priceSnapshot) * item.quantity;
    existing.name = item.nameSnapshot;
    byProduct.set(item.productId, existing);
  }

  const ranked = [...byProduct.entries()]
    .sort((a, b) => b[1].units - a[1].units)
    .slice(0, limit);

  if (ranked.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ranked.map(([id]) => id) } },
    select: { id: true, name: true, slug: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  return ranked.map(([productId, stats], index) => ({
    rank: index + 1,
    productId,
    name: productById.get(productId)?.name ?? stats.name,
    slug: productById.get(productId)?.slug ?? null,
    units: stats.units,
    revenue: String(Math.round(stats.revenue * 100) / 100),
  }));
}

export async function getExpiringDeals(limit = 5) {
  const now = new Date();
  const [productDeals, flashSales] = await Promise.all([
    prisma.product.findMany({
      where: {
        discountPercent: { gt: 0 },
        discountEndsAt: { gt: now },
      },
      orderBy: { discountEndsAt: "asc" },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        discountPercent: true,
        discountEndsAt: true,
      },
    }),
    prisma.flashSale.findMany({
      where: { isActive: true, endsAt: { gt: now } },
      orderBy: { endsAt: "asc" },
      take: limit,
      select: {
        id: true,
        name: true,
        discountPercent: true,
        endsAt: true,
      },
    }),
  ]);

  return {
    productDeals: productDeals.map((deal) => ({
      id: deal.id,
      name: deal.name,
      slug: deal.slug,
      discountPercent: deal.discountPercent,
      endsAt: deal.discountEndsAt ? deal.discountEndsAt.toISOString() : null,
    })),
    flashSales: flashSales.map((sale) => ({
      id: sale.id,
      name: sale.name,
      discountPercent: sale.discountPercent,
      endsAt: sale.endsAt ? sale.endsAt.toISOString() : null,
    })),
  };
}
