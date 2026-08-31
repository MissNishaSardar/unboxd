import { endOfDay, parseISO, startOfDay } from "date-fns";
import type { Prisma } from "@generated/prisma/client";
import prisma from "@/lib/dbClient/prisma";

export const ADMIN_ORDERS_PER_PAGE = 10;

export type AdminOrderRow = {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
};

export async function getAdminOrders(params: {
  status?: string;
  date?: string;
  search?: string;
  page?: number;
}): Promise<{
  orders: AdminOrderRow[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { status, date, search, page = 1 } = params;

  const where: Prisma.OrderWhereInput = {
    ...(status && { status }),
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

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_ORDERS_PER_PAGE,
      take: ADMIN_ORDERS_PER_PAGE,
      include: {
        user: { select: { name: true, email: true } },
        address: { select: { name: true } },
        items: { select: { quantity: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: String(order.total),
      createdAt: order.createdAt.toISOString(),
      customerName: order.address?.name ?? order.user.name,
      customerEmail: order.user.email,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_ORDERS_PER_PAGE)),
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
  const variants =
    variantIds.length > 0 ?
      await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, sku: true },
      })
    : [];
  const skuById = new Map(variants.map((variant) => [variant.id, variant.sku]));

  const productIds = [...new Set(order.items.map((item) => item.productId))];
  const products =
    productIds.length > 0 ?
      await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      })
    : [];
  const imageByProductId = new Map(
    products.map((product) => [product.id, product.images[0]?.url ?? null]),
  );

  return {
    id: order.id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotal: String(order.subtotal),
    shipping: String(order.shipping),
    total: String(order.total),
    createdAt: order.createdAt.toISOString(),
    statusUpdatedAt: order.statusUpdatedAt?.toISOString() ?? null,
    user: order.user,
    address: order.address,
    items: order.items.map((item) => ({
      id: item.id,
      nameSnapshot: item.nameSnapshot,
      priceSnapshot: String(item.priceSnapshot),
      quantity: item.quantity,
      sku: item.variantId ? (skuById.get(item.variantId) ?? null) : null,
      imageUrl: imageByProductId.get(item.productId) ?? null,
    })),
  };
}
