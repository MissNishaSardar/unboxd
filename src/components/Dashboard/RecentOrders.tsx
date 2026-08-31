import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import { getDashboardData } from "@/server/dashboard";
import OrderStatusBadge from "@/components/Orders/OrderStatusBadge";

type RecentOrdersProps = {
  orders: Awaited<ReturnType<typeof getDashboardData>>["recentOrders"];
};

const RecentOrders = ({ orders }: RecentOrdersProps) => {
  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => {
        const itemCount = order.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        return (
          <li key={order.id}>
            <Link
              href={`/orders/${order.id}`}
              className="border-border bg-card hover:bg-muted flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Order {order.id}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDate(order.createdAt)} · {itemCount} item
                  {itemCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <OrderStatusBadge status={order.status} />
                <span className="text-sm font-semibold tabular-nums">
                  {formatPrice(order.total)}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default RecentOrders;
