import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/dbClient/prisma";
import { auth } from "@/lib/auth";
import { orderListSearchParamsSchema } from "@/lib/zodSchema";
import {
  getPlaceholderPhotoUrl,
  resolveProductImageUrl,
} from "@/lib/placeholder";

const ORDERS_PER_PAGE = 10;

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const { page = 1 } = orderListSearchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );
  const where = { userId: session.user.id };
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PER_PAGE,
      take: ORDERS_PER_PAGE,
      include: { items: { select: { quantity: true, productId: true } } },
    }),
    prisma.order.count({ where }),
  ]);
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
  const serializedOrders = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: String(order.total),
    createdAt: order.createdAt.toISOString(),
    items: order.items,
    previews: [...new Set(order.items.map((i) => i.productId))]
      .slice(0, 3)
      .map((productId) => imageByProductId.get(productId) ?? null)
      .filter((src): src is string => src !== null),
  }));
  return NextResponse.json({
    orders: serializedOrders,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ORDERS_PER_PAGE)),
  });
}
