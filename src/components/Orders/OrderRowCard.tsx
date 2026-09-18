"use client";

import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import BuyAgainButton from "@/components/Orders/BuyAgainButton";
import OrderItemImage from "@/components/Orders/OrderItemImage";
import OrderStatusBadge from "@/components/Orders/OrderStatusBadge";

export type OrderRowCardOrder = {
  id: string;
  orderNumber: number;
  status: string;
  total: Parameters<typeof formatPrice>[0];
  createdAt: Parameters<typeof formatDate>[0];
  items: { quantity: number }[];
  previews: string[];
};

const OrderRowCard = ({ order }: { order: OrderRowCardOrder }) => {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const canReorder =
    order.status === "DELIVERED" || order.status === "CANCELLED";

  return (
    <li className="border-border bg-card flex items-center justify-between gap-4 rounded-2xl border p-4">
      <Link
        href={`/orders/${order.id}`}
        className="hover:bg-muted -m-4 flex min-w-0 flex-1 items-center justify-between gap-4 rounded-2xl p-4 transition-colors">
        <div className="flex min-w-0 items-center gap-3">
          {order.previews.length > 0 && (
            <div className="flex shrink-0 -space-x-2">
              {order.previews.map((src) => (
                <div
                  key={src}
                  className="bg-muted ring-card size-10 shrink-0 overflow-hidden rounded-md ring-2">
                  <OrderItemImage
                    src={src}
                    alt={`Order #${order.orderNumber}`}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="min-w-0">
            <p
              className="truncate text-sm font-medium"
              title={order.id}>
              Order #{order.orderNumber}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatDate(order.createdAt)} · {itemCount} item
              {itemCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <span className="text-sm font-semibold tabular-nums">
            {formatPrice(order.total)}
          </span>
        </div>
      </Link>
      {canReorder && (
        <div className="shrink-0">
          <BuyAgainButton orderId={order.id} />
        </div>
      )}
    </li>
  );
};

export default OrderRowCard;
