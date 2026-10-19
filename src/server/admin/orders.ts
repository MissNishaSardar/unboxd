import { endOfDay, parseISO, startOfDay } from "date-fns";
import type { Prisma } from "@generated/prisma/client";
import prisma from "@/lib/dbClient/prisma";
import {
  getPlaceholderPhotoUrl,
  resolveProductImageUrl,
} from "@/lib/placeholder";

export const ADMIN_ORDERS_PER_PAGE = 10;

export type AdminOrderRow = {
  id: string;
  orderNumber: number;
  status: string;
  paymentMethod: string;
  total: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  thumbnails: string[];
  cancelReason: string | null;
  adminCancelReason: string | null;
};

export async function getAdminOrders(params: {
  status?: string;
  date?: string;
  search?: string;
  sort?: string;
  page?: number;
}): Promise<{
  orders: AdminOrderRow[];
  total: number;
  page: number;
  totalPages: number;
  codOutstanding: { count: number; total: string };
  statusCounts: Record<string, number>;
}> {
  const { status, date, search, sort = "date_desc", page = 1 } = params;

  const baseWhere: Prisma.OrderWhereInput = {
    ...(date && {
      createdAt: {
        gte: startOfDay(parseISO(date)),
        lte: endOfDay(parseISO(date)),
      },
    }),
    ...(search && {
      OR: [
        {
          user: {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          },
        },
        { address: { name: { contains: search } } },
      ],
    }),
  };

  const where: Prisma.OrderWhereInput = {
    ...baseWhere,
    ...(status && { status }),
  };

  // Cash still to collect: open COD orders, independent of the status pill
  // so the figure stays stable while filtering. Delivered COD counts as
  // collected, cancelled and returned as never due.
  const codWhere: Prisma.OrderWhereInput = {
    ...baseWhere,
    status: { notIn: ["CANCELLED", "RETURNED"] },
    paymentMethod: "COD",
  };

  const [orders, total, codAggregate, grouped] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy:
        sort === "date_asc" ?
          [{ createdAt: "asc" }, { id: "asc" }]
        : [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * ADMIN_ORDERS_PER_PAGE,
      take: ADMIN_ORDERS_PER_PAGE,
      include: {
        user: { select: { name: true, email: true } },
        address: { select: { name: true } },
        items: { select: { quantity: true, productId: true } },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where: codWhere,
      _count: true,
      _sum: { total: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: true,
    }),
  ]);

  // First image per product for row thumbnails, same fallback as detail.
  const productIds = [
    ...new Set(orders.flatMap((order) => order.items.map((i) => i.productId))),
  ];
  const products =
    productIds.length > 0 ?
      await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          slug: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      })
    : [];
  const imageByProductId = new Map(
    products.map((product) => [
      product.id,
      product.images[0] ?
        resolveProductImageUrl(product.images[0].url, product.slug, 0)
      : getPlaceholderPhotoUrl(product.slug),
    ]),
  );

  const statusCounts: Record<string, number> = {};
  for (const group of grouped) {
    statusCounts[group.status] = group._count;
  }

  return {
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      total: String(order.total),
      createdAt: order.createdAt.toISOString(),
      customerName: order.address?.name ?? order.user.name,
      customerEmail: order.user.email,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      cancelReason: order.cancelReason,
      adminCancelReason: order.adminCancelReason,
      thumbnails: [
        ...new Set(
          order.items.map(
            (item) =>
              imageByProductId.get(item.productId) ??
              getPlaceholderPhotoUrl(item.productId),
          ),
        ),
      ].slice(0, 3),
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_ORDERS_PER_PAGE)),
    codOutstanding: {
      count: codAggregate._count,
      total: String(codAggregate._sum.total ?? 0),
    },
    statusCounts,
  };
}

export async function getAdminOrderDetail(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      address: true,
      items: true,
    },
  });
  if (!order) return null;

  const variantIds = order.items
    .map((item) => item.variantId)
    .filter((id): id is string => id !== null);
  const [variants, customerStats] = await Promise.all([
    variantIds.length > 0 ?
      prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, sku: true },
      })
    : [],
    prisma.order
      .aggregate({
        where: {
          userId: order.userId,
          status: { notIn: ["CANCELLED", "RETURNED", "DELIVERED"] },
        },
        _count: true,
        _sum: { total: true },
      })
      .then((result) => ({
        orderCount: result._count,
        lifetimeValue: String(result._sum.total ?? 0),
      })),
  ]);
  const skuById = new Map(variants.map((variant) => [variant.id, variant.sku]));

  const productIds = [...new Set(order.items.map((item) => item.productId))];
  const products =
    productIds.length > 0 ?
      await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          slug: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      })
    : [];
  const imageByProductId = new Map(
    products.map((product) => [
      product.id,
      product.images[0] ?
        resolveProductImageUrl(product.images[0].url, product.slug, 0)
      : getPlaceholderPhotoUrl(product.slug),
    ]),
  );

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotal: String(order.subtotal),
    shipping: String(order.shipping),
    total: String(order.total),
    createdAt: order.createdAt.toISOString(),
    statusUpdatedAt: order.statusUpdatedAt?.toISOString() ?? null,
    cancellation:
      order.status === "CANCELLED" ?
        {
          adminCancelReason: order.adminCancelReason,
          reason: order.cancelReason,
          note: order.cancelNote,
          cancelledAt: order.cancelledAt?.toISOString() ?? null,
          cancelledBy: order.cancelledBy,
        }
      : null,
    user: order.user,
    customerStats,
    address: order.address,
    items: order.items.map((item) => {
      const imageUrl = imageByProductId.get(item.productId);
      const fallbackSeed =
        item.nameSnapshot.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
        item.productId;
      return {
        id: item.id,
        productId: item.productId,
        nameSnapshot: item.nameSnapshot,
        priceSnapshot: String(item.priceSnapshot),
        quantity: item.quantity,
        sku: item.variantId ? (skuById.get(item.variantId) ?? null) : null,
        imageUrl: imageUrl ?? getPlaceholderPhotoUrl(fallbackSeed),
      };
    }),
  };
}
