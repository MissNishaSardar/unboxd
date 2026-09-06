"use client";

/* eslint-disable react-hooks/set-state-in-effect -- syncing searchParams to grid after filter change is intentional */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductGrid from "@/components/Product/ProductGrid";
import { Button } from "@/components/shadcnui/button";
import type { toProductCardData } from "@/server/catalog";

type ProductCardData = ReturnType<typeof toProductCardData>;

type Props = {
  initialProducts: ProductCardData[];
  total: number;
  pathname?: string;
};

const ProductLoadMoreGrid = ({ initialProducts, total }: Props) => {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Reset when filters change (q, categories, brand, sort, min, max) or initial data refreshes
  useEffect(() => {
    setProducts(initialProducts);
    setPage(1);
  }, [initialProducts]);

  const canLoadMore = products.length < total;

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setIsLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(nextPage));
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { products: ProductCardData[] };
      setProducts((prev) => [...prev, ...data.products]);
      setPage(nextPage);
      // keep URL in sync without navigation? optionally update page param shallow
      // we keep URL as-is to avoid polluting history; products page will show ?page if user manually navigates
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ProductGrid products={products} />
      {canLoadMore && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-muted-foreground text-xs tabular-nums">
            Showing {products.length} of {total}
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="w-full rounded-full px-8 sm:w-auto">
            {isLoading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
};

export default ProductLoadMoreGrid;
