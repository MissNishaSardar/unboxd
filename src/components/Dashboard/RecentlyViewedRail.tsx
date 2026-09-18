"use client";

import { useEffect, useState } from "react";
import ProductRail from "./ProductRail";
import type { ProductCardData } from "@/components/Product/ProductCard";
import { useMounted } from "@/hooks/use-mounted";
import { getRecentProductIds } from "@/lib/recentlyViewed";
import { getProductsByIds } from "@/server/wishlist";

const RecentlyViewedRail = () => {
  const mounted = useMounted();
  const [products, setProducts] = useState<ProductCardData[]>([]);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    void (async () => {
      const ids = getRecentProductIds();
      if (ids.length === 0) return;
      try {
        const data = await getProductsByIds(ids);
        if (!cancelled) setProducts(data);
      } catch {
        // Rail stays hidden when resolution fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  if (products.length === 0) return null;
  return (
    <ProductRail
      title="Continue shopping"
      products={products}
    />
  );
};

export default RecentlyViewedRail;
