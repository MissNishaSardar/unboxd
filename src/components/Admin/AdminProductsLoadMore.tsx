"use client";

/* eslint-disable react-hooks/set-state-in-effect -- syncing URL query state to list after filter change is intentional */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductsTable from "@/components/Admin/ProductsTable";
import type { AdminProductRow } from "@/components/Admin/ProductsColumns";
import { Button } from "@/components/shadcnui/button";
import { toast } from "@/components/shadcnui/toast";

const AdminProductsLoadMore = ({
  initialProducts,
  total,
  lowStockThreshold = 5,
}: {
  initialProducts: AdminProductRow[];
  total: number;
  lowStockThreshold?: number;
}) => {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProducts(initialProducts);
    setPage(1);
    setError(null);
  }, [initialProducts]);

  const canLoadMore = products.length < total;

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(nextPage));
      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (!res.ok) {
        toast.add({ title: "Could not load more products", type: "error" });
        setError("Could not load more products. Try again.");
        return;
      }
      const data = (await res.json()) as { products: AdminProductRow[] };
      setProducts((prev) => [...prev, ...data.products]);
      setPage(nextPage);
    } catch {
      toast.add({ title: "Could not load more products", type: "error" });
      setError("Could not load more products. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProductsTable
        products={products}
        total={total}
        lowStockThreshold={lowStockThreshold}
      />
      {canLoadMore && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-muted-foreground text-xs tabular-nums">
            Showing {products.length} of {total}
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={loading}
            className="w-full rounded-full px-8 sm:w-auto">
            {loading ? "Loading" : "Load more"}
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

export default AdminProductsLoadMore;
