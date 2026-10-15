"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBagIcon,
  StarIcon,
  ZapIcon,
  BadgeCheckIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent, CardFooter } from "@/components/shadcnui/card";
import { toast } from "@/components/shadcnui/toast";
import WishlistButton from "@/components/Product/WishlistButton";
import { addToCart } from "@/lib/cart/atoms";
import { displayProductName } from "@/lib/brand";
import { formatPrice } from "@/lib/format";
import { discountBadge, hasDiscount } from "@/lib/pricing";
import { resolveProductImageUrl } from "@/lib/placeholder";
import { getRatingSummary, getReviewsForProduct } from "@/lib/reviews";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  basePrice: string;
  discountPercent: number;
  price: number;
  mrp: number;
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

const ProductCard = ({
  product,
  compact,
}: {
  product: ProductCardData;
  compact?: boolean;
}) => {
  const image = product.images[0];
  const thumbnailUrl = resolveProductImageUrl(
    image?.url ?? "",
    product.slug,
    0,
  );
  const thumbnailAlt = image?.alt ?? product.name;
  const [imgFailed, setImgFailed] = useState(false);
  const variant = product.defaultVariant;
  const price = product.price;
  const discounted = hasDiscount(product.discountPercent);
  const outOfStock = !variant || variant.stock === 0;
  const lowStock = variant && variant.stock > 0 && variant.stock < 5;
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const rating = getRatingSummary(getReviewsForProduct(product.slug));
  const displayName = displayProductName(product.name, product.brand);

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
      name: displayName,
      variantName: variant.name,
      price,
      mrp: product.mrp,
      image: thumbnailUrl,
      maxStock: variant.stock,
    });
    toast.add({
      title: "Added to cart",
      description: `${displayName} · ${variant.name}`,
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
      name: displayName,
      variantName: variant.name,
      price,
      mrp: product.mrp,
      image: thumbnailUrl,
      maxStock: variant.stock,
    });
    router.push("/checkout");
  };

  return (
    <Card className="group flex flex-col gap-0 overflow-hidden p-0 py-0 [--card-spacing:0px]">
      <div
        className={cn(
          "bg-muted relative w-full overflow-hidden",
          compact ? "aspect-[4/3]" : "aspect-square",
        )}>
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

      <CardContent
        className={cn(
          "flex flex-col gap-0.5 px-3 pt-3 pb-0",
          compact && "gap-0 px-2.5 pt-2",
        )}>
        <span className="flex items-center justify-start gap-1">
          <Link
            href={`/products?brand=${product.brandSlug}`}
            className={cn(
              "text-muted-foreground font-medium tracking-wide uppercase hover:underline",
              compact ? "text-[10px]" : "text-[11px]",
            )}>
            {product.brand}
          </Link>
          <BadgeCheckIcon
            aria-label="Verified brand"
            className={cn(
              "fill-sky-500 text-white",
              compact ? "size-3" : "size-3.5",
            )}
          />
        </span>
        <Link
          href={`/products/${product.slug}`}
          className={cn(
            "leading-tight font-medium hover:underline",
            compact ? "line-clamp-1 text-xs" : "line-clamp-2 text-sm",
          )}>
          {displayName}
        </Link>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span
            className={cn(
              "font-semibold tabular-nums",
              compact ? "text-sm" : "text-base",
            )}>
            {formatPrice(price)}
          </span>
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
        {/* Fixed-height discount slot. Empty on full-price cards so every
            card in a row measures the same with or without a discount. */}
        <div className="flex h-5 items-center gap-1.5">
          {discounted && (
            <>
              <span className="text-muted-foreground text-[11px] tabular-nums line-through">
                {formatPrice(product.mrp)}
              </span>
              <span className="rounded-full bg-green-600/10 px-1.5 py-0.5 text-[11px] font-semibold text-green-700 dark:text-green-400">
                {discountBadge(product.discountPercent)}
              </span>
            </>
          )}
        </div>
        {variant && !compact && (
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
                  i + 1 <= Math.round(rating.average) ?
                    "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground/30",
                  compact ? "size-2.5" : "size-3",
                )}
              />
            ))}
          </span>
          <span
            className={cn(
              "text-muted-foreground tabular-nums",
              compact ? "text-[11px]" : "text-xs",
            )}>
            {rating.average.toFixed(1)} ({rating.count})
          </span>
        </div>
      </CardContent>

      <CardFooter
        className={cn(
          "mt-auto flex flex-col gap-0 px-3 pt-2 pb-3",
          compact && "px-2.5 pt-1.5 pb-2.5",
        )}>
        {compact ?
          <Button
            size="sm"
            variant="outline"
            disabled={outOfStock}
            onClick={handleAddToCart}
            className="w-full">
            <ShoppingBagIcon className="size-3.5" />
            Add
          </Button>
        : <>
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
          </>
        }
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
