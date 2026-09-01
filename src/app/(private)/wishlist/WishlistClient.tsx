"use client";

import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import Link from "next/link";
import { HeartIcon } from "lucide-react";
import ProductGrid from "@/components/Product/ProductGrid";
import type { ProductCardData } from "@/components/Product/ProductCard";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import { Button } from "@/components/shadcnui/button";
import { authClient } from "@/lib/auth-client";
import { wishlistAtom } from "@/lib/wishlist/atoms";
import { getProductsByIds, getWishlistIds } from "@/server/wishlist";

const WishlistClient = () => {
  const ids = useAtomValue(wishlistAtom);
  const setIds = useSetAtom(wishlistAtom);
  const { data: session } = authClient.useSession();
  const [products, setProducts] = useState<ProductCardData[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let currentIds = ids;
      if (session) {
        try {
          currentIds = await getWishlistIds();
          setIds((prev) => {
            const next = [...new Set(currentIds)];
            if (
              prev.length === next.length &&
              prev.every((id, index) => id === next[index])
            ) {
              return prev;
            }
            return next;
          });
        } catch {
          return;
        }
      }
      const data = await getProductsByIds(currentIds);
      if (!cancelled) setProducts(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [ids, session, setIds]);

  return (
    <div className="flex max-w-6xl mx-auto flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Wishlist
        </h1>
        <p className="text-muted-foreground text-sm">
          {products.length === 0 ?
            "Nothing saved yet"
          : `${products.length} item${products.length === 1 ? "" : "s"}`}
        </p>
      </header>

      {products.length === 0 ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HeartIcon />
            </EmptyMedia>
            <EmptyTitle>Your wishlist is empty</EmptyTitle>
            <EmptyDescription>
              Tap the heart on any product to save it here.
            </EmptyDescription>
          </EmptyHeader>
          <Button
            render={<Link href="/products" />}
            nativeButton={false}>
            Browse products
          </Button>
        </Empty>
      : <ProductGrid products={products} />}
    </div>
  );
};

export default WishlistClient;
