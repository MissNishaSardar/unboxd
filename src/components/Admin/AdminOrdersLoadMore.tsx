"use client";

/* eslint-disable react-hooks/set-state-in-effect -- syncing URL query state to list after filter change is intentional */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import OrdersTable from "@/components/Admin/OrdersTable";
import { Button } from "@/components/shadcnui/button";
import { toast } from "@/components/shadcnui/toast";
import type { AdminOrderRow } from "@/server/admin/orders";

const AdminOrdersLoadMore = ({
  initialOrders,
  total,
  statusCounts,
}: {
  initialOrders: AdminOrderRow[];
  total: number;
  statusCounts: Record<string, number>;
}) => {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState(initialOrders);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrders(initialOrders);
    setPage(1);
    setError(null);
  }, [initialOrders]);

  const canLoadMore = orders.length < total;

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(nextPage));
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) {
        toast.add({ title: "Could not load more orders", type: "error" });
        setError("Could not load more orders. Try again.");
        return;
      }
      const data = (await res.json()) as { orders: AdminOrderRow[] };
      setOrders((prev) => [...prev, ...data.orders]);
      setPage(nextPage);
    } catch {
      toast.add({ title: "Could not load more orders", type: "error" });
      setError("Could not load more orders. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <OrdersTable
        orders={orders}
        total={total}
        statusCounts={statusCounts}
      />
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
          {error && (
            <p
              role="alert"
              className="text-destructive text-xs">
              {error}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default AdminOrdersLoadMore;
