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
      include: { items: true },
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
  ]);

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
          initialOrders={orders as never}
          total={total}
        />
      }
    </div>
  );
};

export default OrdersPage;
