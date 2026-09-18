"use client";

/* eslint-disable react-hooks/set-state-in-effect -- syncing URL query state to list after filter change is intentional */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/shadcnui/button";
import OrderRowCard from "@/components/Orders/OrderRowCard";

type OrderRow = {
  id: string;
  orderNumber: number;
  status: string;
  total: string;
  createdAt: string;
  items: { quantity: number; productId: string }[];
  previews: string[];
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
        {orders.map((order) => (
          <OrderRowCard
            key={order.id}
            order={order}
          />
        ))}
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
