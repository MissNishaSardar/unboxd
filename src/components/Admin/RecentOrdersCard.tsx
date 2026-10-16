import type { Route } from "next";
import Link from "next/link";
import AdminEmptyState from "@/components/Admin/AdminEmptyState";
import OrderStatusBadge from "@/components/Orders/OrderStatusBadge";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getRecentOrders } from "@/server/admin/queries";

const RecentOrdersCard = async ({ className }: { className?: string }) => {
  const orders = await getRecentOrders(7);

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <CardDescription>Latest customer checkouts</CardDescription>
        {orders.length > 0 && (
          <CardAction>
            <Button
              render={<Link href={"/admin/orders" as Route} />}
              nativeButton={false}
              variant="outline"
              size="sm">
              View all
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {orders.length === 0 ?
          <AdminEmptyState
            title="No orders yet"
            message="Orders will appear here once customers check out. Share your store to get the first order in."
          />
        : <ul className="divide-border flex flex-col divide-y">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/orders/${order.id}` as Route}
                      className="truncate text-sm font-medium underline-offset-4 hover:underline">
                      #{order.orderNumber}
                    </Link>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {order.customerName} · {order.itemCount} item
                    {order.itemCount === 1 ? "" : "s"} ·{" "}
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatPrice(order.total)}
                </span>
              </li>
            ))}
          </ul>
        }
      </CardContent>
    </Card>
  );
};

export default RecentOrdersCard;
