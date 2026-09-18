import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageIcon } from "lucide-react";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Orders",
  description: "View and track your Unboxd orders.",
};
import prisma from "@/lib/dbClient/prisma";
import { headers } from "next/headers";
import { orderListSearchParamsSchema } from "@/lib/zodSchema";
import {
  getPlaceholderPhotoUrl,
  resolveProductImageUrl,
} from "@/lib/placeholder";
import { Button } from "@/components/shadcnui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import OrdersLoadMore from "@/components/Orders/OrdersLoadMore";

const ORDERS_PER_PAGE = 10;

const OrdersPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/login");

  const { page = 1 } = orderListSearchParamsSchema.parse(await searchParams);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PER_PAGE,
      take: ORDERS_PER_PAGE,
      include: {
        items: { select: { quantity: true, productId: true } },
      },
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Orders
        </h1>
        <p className="text-muted-foreground text-sm">Your order history</p>
      </div>

      {orders.length === 0 ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No orders yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t placed any orders yet. Browse the catalog and
              place your first order.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              render={<Link href="/products" />}
              nativeButton={false}>
              Browse products
            </Button>
          </EmptyContent>
        </Empty>
      : <OrdersLoadMore
          initialOrders={serializedOrders}
          total={total}
        />
      }
    </div>
  );
};

export default OrdersPage;
