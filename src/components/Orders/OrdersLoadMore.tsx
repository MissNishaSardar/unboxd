"use client";

/* eslint-disable react-hooks/set-state-in-effect -- syncing URL query state to list after filter change is intentional */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/shadcnui/button";
import { formatDate, formatPrice } from "@/lib/format";
import OrderStatusBadge from "@/components/Orders/OrderStatusBadge";

type OrderRow = {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  items: { quantity: number }[];
};

const OrdersLoadMore = ({
  initialOrders,
  total,
}: {
  initialOrders: OrderRow[];
  total: number;
}) => {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState(initialOrders);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOrders(initialOrders);
    setPage(1);
  }, [initialOrders]);

  const canLoadMore = orders.length < total;

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(nextPage));
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = (await res.json()) as { orders: OrderRow[] };
      setOrders((prev) => [...prev, ...data.orders]);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ul className="flex flex-col gap-3">
        {orders.map((order) => {
          const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
          return (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="border-border bg-card hover:bg-muted flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    Order {order.id}
                  </p>
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
      {canLoadMore && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-muted-foreground text-xs tabular-nums">
            Showing {orders.length} of {total}
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={loading}
            className="w-full rounded-full px-8 sm:w-auto">
            {loading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
};

export default OrdersLoadMore;
