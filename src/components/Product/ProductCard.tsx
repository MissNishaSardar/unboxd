"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBagIcon, StarIcon, ZapIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent, CardFooter } from "@/components/shadcnui/card";
import { toast } from "@/components/shadcnui/toast";
import WishlistButton from "@/components/Product/WishlistButton";
import { addToCart } from "@/lib/cart/atoms";
import { formatPrice } from "@/lib/format";
import { resolveProductImageUrl } from "@/lib/placeholder";
import { getRatingSummary, getReviewsForProduct } from "@/lib/reviews";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  basePrice: string;
  brand: string;
  brandSlug: string;
  category: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
  defaultVariant: {
    sku: string;
    name: string;
    priceDiff: string;
    stock: number;
  } | null;
};

const ProductCard = ({ product }: { product: ProductCardData }) => {
  const image = product.images[0];
  const thumbnailUrl = resolveProductImageUrl(
    image?.url ?? "",
    product.slug,
    0,
  );
  const thumbnailAlt = image?.alt ?? product.name;
  const [imgFailed, setImgFailed] = useState(false);
  const variant = product.defaultVariant;
  const price =
    Number(product.basePrice) + (variant ? Number(variant.priceDiff) : 0);
  const outOfStock = !variant || variant.stock === 0;
  const lowStock = variant && variant.stock > 0 && variant.stock < 5;
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const rating = getRatingSummary(getReviewsForProduct(product.slug));

  const handleAddToCart = () => {
    if (isPending) return;
    if (!session) {
      toast.add({
        title: "Sign in to add items to your cart",
        type: "error",
      });
      router.push(`/auth/login?callbackUrl=/products/${product.slug}`);
      return;
    }
    if (!variant) return;
    addToCart({
      productId: product.id,
      sku: variant.sku,
      slug: product.slug,
      name: product.name,
      variantName: variant.name,
      price,
      image: thumbnailUrl,
      maxStock: variant.stock,
    });
    toast.add({
      title: "Added to cart",
      description: `${product.name} · ${variant.name}`,
      type: "success",
    });
  };

  const handleBuyNow = () => {
    if (isPending) return;
    if (!session) {
      toast.add({ title: "Sign in to buy now", type: "error" });
      router.push(`/auth/login?callbackUrl=/checkout`);
      return;
    }
    if (!variant) return;
    addToCart({
      productId: product.id,
      sku: variant.sku,
      slug: product.slug,
      name: product.name,
      variantName: variant.name,
      price,
      image: thumbnailUrl,
      maxStock: variant.stock,
    });
    router.push("/checkout");
  };

  return (
    <Card className="group flex flex-col gap-0 overflow-hidden p-0 py-0 [--card-spacing:0px]">
      <div className="bg-muted relative aspect-square w-full overflow-hidden">
        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0">
          <Image
            src={imgFailed ? "/placeholder.svg" : thumbnailUrl}
            alt={thumbnailAlt}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            onError={() => setImgFailed(true)}
          />
        </Link>
        <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium tracking-wide text-white uppercase backdrop-blur">
          {product.category.name}
        </span>
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton
            productId={product.id}
            variant="secondary"
            size="icon-sm"
            className="size-7 rounded-full border border-black/10 bg-white shadow-sm hover:bg-white dark:border-white/15 dark:bg-zinc-900"
          />
        </div>
      </div>

      <CardContent className="flex flex-col gap-0.5 px-3 pt-3 pb-0">
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-sm leading-tight font-medium hover:underline">
          {product.name}
        </Link>
        <div className="flex items-center justify-between pt-1">
          <p className="text-base font-semibold tabular-nums">
            {formatPrice(price)}
          </p>
          {lowStock && (
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              Low stock
            </span>
          )}
          {outOfStock && (
            <span className="text-muted-foreground text-[11px] font-medium">
              Out of stock
            </span>
          )}
        </div>
        {variant && (
          <p className="text-muted-foreground line-clamp-1 text-xs">
            {variant.name}
          </p>
        )}
        <div className="flex items-center gap-1 pt-0.5">
          <span
            className="flex items-center gap-0.5"
            aria-label={`${rating.average} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                className={cn(
                  "size-3",
                  i + 1 <= Math.round(rating.average) ?
                    "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground/30",
                )}
              />
            ))}
          </span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {rating.average.toFixed(1)} ({rating.count})
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-0 px-3 pt-2 pb-3">
        <div className="hidden w-full gap-2 md:flex">
          <Button
            size="sm"
            variant="outline"
            disabled={outOfStock}
            onClick={handleAddToCart}
            className="flex-1">
            <ShoppingBagIcon className="size-3.5" />
            Add
          </Button>
          <Button
            size="sm"
            disabled={outOfStock}
            onClick={handleBuyNow}
            className="flex-1">
            <ZapIcon className="size-3.5" />
            Buy Now
          </Button>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 md:hidden">
          <Button
            size="sm"
            variant="outline"
            disabled={outOfStock}
            onClick={handleAddToCart}>
            <ShoppingBagIcon className="size-4" />
            Add
          </Button>
          <Button
            size="sm"
            disabled={outOfStock}
            onClick={handleBuyNow}>
            <ZapIcon className="size-4" />
            Buy Now
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
