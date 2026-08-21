import prisma from "@/lib/dbClient/prisma";

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED"];

export async function getDashboardData(userId: string) {
  const [orderCount, activeCount, spentAggregate, recentOrders, activeOrder] =
    await Promise.all([
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
    ]);

  return {
    orderCount,
    activeCount,
    totalSpent: String(spentAggregate._sum.total ?? 0),
    recentOrders,
    activeOrder,
  };
}
