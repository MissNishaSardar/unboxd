import prisma from "@/lib/dbClient/prisma";
import {
  getPlaceholderPhotoUrl,
  resolveProductImageUrl,
} from "@/lib/placeholder";
import { getTopRatedProducts } from "./catalog";
import { getProductsByIds } from "./wishlist";

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED"];

export async function getDashboardData(userId: string) {
  const [
    orderCount,
    activeCount,
    spentAggregate,
    recentOrders,
    activeOrder,
    wishlistIds,
    topRated,
  ] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.order.count({
      where: { userId, status: { in: ACTIVE_STATUSES } },
    }),
    prisma.order.aggregate({
      where: { userId, status: { notIn: ["CANCELLED", "RETURNED"] } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { items: true },
    }),
    prisma.order.findFirst({
      where: { userId, status: { in: ACTIVE_STATUSES } },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
    prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { productId: true },
    }),
    getTopRatedProducts(10),
  ]);

  const wishlistProducts = await getProductsByIds(
    wishlistIds.map((item) => item.productId),
  );

  const recentProductIds = [
    ...new Set(
      recentOrders.flatMap((order) => order.items.map((i) => i.productId)),
    ),
  ];
  const recentProducts =
    recentProductIds.length > 0 ?
      await prisma.product.findMany({
        where: { id: { in: recentProductIds } },
        select: {
          id: true,
          slug: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      })
    : [];
  const recentImageByProductId = new Map(
    recentProducts.map((product) => [
      product.id,
      product.images[0] ?
        resolveProductImageUrl(product.images[0].url, product.slug, 0)
      : getPlaceholderPhotoUrl(product.slug),
    ]),
  );

  return {
    orderCount,
    activeCount,
    totalSpent: String(spentAggregate._sum.total ?? 0),
    recentOrders: recentOrders.map((order) => ({
      ...order,
      previews: [...new Set(order.items.map((i) => i.productId))]
        .slice(0, 3)
        .map((productId) => recentImageByProductId.get(productId) ?? null)
        .filter((src): src is string => src !== null),
    })),
    activeOrder,
    wishlistProducts,
    topRated,
  };
}
