"use client";

import { useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import { parseAsString, useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AwardIcon,
  BadgeCheckIcon,
  CheckIcon,
  ChevronDownIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  TruckIcon,
  ZapIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent } from "@/components/shadcnui/card";
import { Separator } from "@/components/shadcnui/separator";
import { toast } from "@/components/shadcnui/toast";
import WishlistButton from "@/components/Product/WishlistButton";
import { addToCart } from "@/lib/cart/atoms";
import { displayProductName } from "@/lib/brand";
import { formatPrice } from "@/lib/format";
import { discountBadge, effectivePrice, hasDiscount } from "@/lib/pricing";
import { getReviewsAtom } from "@/lib/reviews/atoms";
import type { ReviewDTO } from "@/server/reviews";

export type ProductInfoVariant = {
  sku: string;
  name: string;
  priceDiff: string;
  stock: number;
};

type ParsedVariant = ProductInfoVariant & {
  colour: string;
  model: string | null;
};

function parseVariant(v: ProductInfoVariant): ParsedVariant {
  const parts = v.name.split(" / ");
  if (parts.length === 1) {
    return { ...v, colour: parts[0].trim(), model: null };
  }
  return {
    ...v,
    colour: parts[0].trim(),
    model: parts.slice(1).join(" / ").trim(),
  };
}

function Chip({
  label,
  selected,
  disabled,
  onClick,
  sub,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  sub?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={
        selected ?
          "bg-primary text-primary-foreground border-primary inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-semibold shadow-sm"
        : "bg-background text-foreground border-border hover:border-foreground/20 hover:bg-muted inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium disabled:opacity-40"
      }>
      {selected && (
        <CheckIcon
          className="size-3.5"
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
      {sub && (
        <span
          className={
            selected ?
              "text-primary-foreground/80 text-xs"
            : "text-muted-foreground text-xs"
          }>
          {sub}
        </span>
      )}
    </button>
  );
}

function getRatingSummaryLocal(reviews: ReviewDTO[]) {
  if (reviews.length === 0)
    return {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
        1 | 2 | 3 | 4 | 5,
        number
      >,
    };
  const dist: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let sum = 0;
  for (const r of reviews) {
    sum += r.rating;
    dist[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
  }
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
    distribution: dist,
  };
}

const ProductInfo = ({
  productId,
  slug,
  name,
  brand,
  brandSlug,
  basePrice,
  discountPercent,
  priceFrom,
  mrpFrom,
  image,
  variants,
  description,
  initialReviews,
}: {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  brandSlug: string;
  basePrice: string;
  discountPercent: number;
  priceFrom: string;
  mrpFrom: string;
  image: string;
  variants: ProductInfoVariant[];
  description: string;
  initialReviews: ReviewDTO[];
}) => {
  const parsed = useMemo(() => variants.map(parseVariant), [variants]);
  const colours = useMemo(
    () => Array.from(new Set(parsed.map((p) => p.colour))),
    [parsed],
  );
  const models = useMemo(
    () =>
      Array.from(
        new Set(parsed.map((p) => p.model).filter(Boolean) as string[]),
      ),
    [parsed],
  );
  const hasModels = models.length > 0;

  const defaultSku = useMemo(
    () => parsed.find((v) => v.stock > 0)?.sku ?? parsed[0]?.sku,
    [parsed],
  );
  const [sku, setSku] = useQueryState(
    "variant",
    parseAsString.withDefault(defaultSku ?? ""),
  );
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const variant =
    parsed.find((c) => c.sku === sku) ??
    parsed.find((c) => c.sku === defaultSku);

  // Hooks must run before any early return
  const [open, setOpen] = useState({
    description: true,
    specs: false,
  });
  const toggle = (k: keyof typeof open) =>
    setOpen((p) => ({ ...p, [k]: !p[k] }));

  const scrollToReviews = () =>
    document
      .getElementById("reviews-full")
      ?.scrollIntoView({ behavior: "smooth" });

  const deliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }, []);
  const reviewsAtom = getReviewsAtom(slug);
  const [reviews, setReviews] = useAtom(reviewsAtom);
  useEffect(() => {
    if (reviews.length === 0 && initialReviews.length > 0)
      setReviews(initialReviews);
  }, [initialReviews, reviews.length, setReviews]);
  const displayReviews = reviews.length > 0 ? reviews : initialReviews;
  const rating = useMemo(
    () => getRatingSummaryLocal(displayReviews),
    [displayReviews],
  );

  const specs = useMemo(() => {
    if (!variant) return [] as [string, string][];
    return [
      [
        "Category",
        hasModels ? "Multiple configurations" : "Single configuration",
      ],
      ["SKU", variant.sku],
      [
        "Availability",
        variant.stock === 0 ? "Out of stock"
        : variant.stock <= 5 ? `Only ${variant.stock} left`
        : "In stock",
      ],
      [
        "Price",
        formatPrice(
          effectivePrice(
            Number(basePrice),
            Number(variant.priceDiff),
            discountPercent,
          ),
        ),
      ],
      ["Warranty", "1 year manufacturer warranty"],
    ] as [string, string][];
  }, [hasModels, variant, basePrice, discountPercent]);

  if (!variant) return null;

  const price = effectivePrice(
    Number(basePrice),
    Number(variant.priceDiff),
    discountPercent,
  );
  const mrpValue = Number(basePrice) + Number(variant.priceDiff);
  const discounted = hasDiscount(discountPercent);
  const outOfStock = variant.stock === 0;
  const lowStock = !outOfStock && variant.stock <= 5;
  const showsFrom = Number(priceFrom) < price;
  const displayName = displayProductName(name, brand);

  const selectedColour = variant.colour;
  const selectedModel = variant.model;

  const handleColour = (colour: string) => {
    const sameModel =
      selectedModel &&
      parsed.find((p) => p.colour === colour && p.model === selectedModel);
    const fallback = parsed.find((p) => p.colour === colour);
    const next = sameModel ?? fallback;
    if (next) void setSku(next.sku);
  };

  const handleModel = (model: string) => {
    const sameColour = parsed.find(
      (p) => p.colour === selectedColour && p.model === model,
    );
    const fallback = parsed.find((p) => p.model === model);
    const next = sameColour ?? fallback;
    if (next) void setSku(next.sku);
  };

  const handleAddToCart = () => {
    if (isPending) return;
    if (!session) {
      toast.add({ title: "Sign in to add items to your cart", type: "error" });
      router.push(`/auth/login?callbackUrl=/products/${slug}`);
      return;
    }
    addToCart({
      productId,
      sku: variant.sku,
      slug,
      name: displayName,
      variantName: variant.name,
      price,
      mrp: mrpValue,
      image,
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
      router.push(
        `/auth/login?callbackUrl=/checkout?buyNow=${variant.sku}` as never,
      );
      return;
    }
    router.push(`/checkout?buyNow=${variant.sku}` as never);
  };

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-6">
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-2">
            <span className="flex items-center justify-start gap-1">
              <Link
                href={`/products?brand=${brandSlug}`}
                className="text-muted-foreground text-xs font-medium tracking-wide uppercase hover:underline">
                {brand}
              </Link>
              <BadgeCheckIcon
                aria-label="Verified brand"
                className="size-4 fill-sky-500 text-white"
              />
            </span>
            <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              {displayName}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-semibold tabular-nums">
                {formatPrice(price)}
              </p>
              {discounted && (
                <p className="text-muted-foreground text-lg tabular-nums line-through">
                  {formatPrice(mrpValue)}
                </p>
              )}
              {discounted && (
                <Badge className="bg-green-600 text-white hover:bg-green-600">
                  {discountBadge(discountPercent)}
                </Badge>
              )}
              {showsFrom && (
                <p className="text-muted-foreground w-full text-sm">
                  from {formatPrice(priceFrom)}
                  {discounted && (
                    <span className="line-through">
                      {" "}
                      (MRP from {formatPrice(mrpFrom)})
                    </span>
                  )}
                </p>
              )}
              <button
                type="button"
                onClick={scrollToReviews}
                className="text-sm text-amber-500 underline decoration-amber-500/30 underline-offset-4 hover:decoration-amber-500">
                ★ {rating.average.toFixed(1)} ({rating.count})
              </button>
            </div>
            <div>
              {outOfStock ?
                <Badge variant="destructive">Out of Stock</Badge>
              : lowStock ?
                <Badge variant="outline">Only {variant.stock} left</Badge>
              : <Badge>In Stock</Badge>}
            </div>
          </div>

          {/* Split variant chips */}
          {parsed.length > 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">
                  Colour:{" "}
                  <span className="text-muted-foreground font-normal">
                    {selectedColour}
                  </span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {colours.map((c) => {
                    const disabled = !parsed.some(
                      (p) => p.colour === c && p.stock > 0,
                    );
                    return (
                      <Chip
                        key={c}
                        label={c}
                        selected={c === selectedColour}
                        disabled={disabled}
                        onClick={() => handleColour(c)}
                      />
                    );
                  })}
                </div>
              </div>

              {hasModels && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">
                    Model:{" "}
                    <span className="text-muted-foreground font-normal">
                      {selectedModel ?? "-"}
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {models.map((m) => {
                      const disabled = !parsed.some(
                        (p) => p.model === m && p.stock > 0,
                      );
                      const priceForModel = parsed.find((p) => p.model === m);
                      const sub =
                        priceForModel ?
                          formatPrice(
                            effectivePrice(
                              Number(basePrice),
                              Number(priceForModel.priceDiff),
                              discountPercent,
                            ),
                          )
                        : undefined;
                      return (
                        <Chip
                          key={m}
                          label={m}
                          selected={m === selectedModel}
                          disabled={disabled}
                          onClick={() => handleModel(m)}
                          sub={sub}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-muted-foreground text-xs">
                Selected: {variant.name} {outOfStock && "· Out of stock"}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="bg-background hover:bg-muted flex-1 border-2 font-semibold shadow-xs dark:border-white/15 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              disabled={outOfStock}
              onClick={handleAddToCart}
              data-icon="inline-start">
              <ShoppingBagIcon aria-hidden="true" />
              {outOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 font-semibold shadow-md"
              disabled={outOfStock}
              onClick={handleBuyNow}
              data-icon="inline-start">
              <ZapIcon aria-hidden="true" />
              Buy Now
            </Button>
            <WishlistButton
              productId={productId}
              variant="outline"
              size="icon-lg"
              className="bg-background hover:bg-muted h-11 w-11 border-2 shadow-xs dark:border-white/15 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 [&_svg]:size-5"
            />
          </div>

          {/* Delivery and trust, fills the dead space */}
          <div className="bg-muted/40 flex flex-col gap-3 rounded-xl border p-4">
            <div className="flex items-start gap-3 text-sm">
              <TruckIcon
                className="text-primary mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <div className="flex flex-col">
                <span className="font-medium">
                  Free delivery by {deliveryDate}
                </span>
                <span className="text-muted-foreground text-xs">
                  Cash on Delivery available · Free 7-day returns
                </span>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheckIcon
                  className="size-4"
                  aria-hidden="true"
                />
                <span>Genuine</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcwIcon
                  className="size-4"
                  aria-hidden="true"
                />
                <span>7-day return</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <AwardIcon
                  className="size-4"
                  aria-hidden="true"
                />
                <span>1-yr warranty</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accordions live in buy box */}
      <Card className="overflow-hidden">
        <div className="flex flex-col">
          {[
            {
              key: "description" as const,
              title: "Description",
              content: (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {description}
                </p>
              ),
            },
            {
              key: "specs" as const,
              title: "Specifications",
              content: (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {specs.map(([k, v]) => (
                    <div
                      key={k}
                      className="flex flex-col gap-0.5">
                      <dt className="text-muted-foreground text-xs">{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              ),
            },
          ].map((section) => (
            <div
              key={section.key}
              className="border-b last:border-0">
              <button
                type="button"
                onClick={() => toggle(section.key)}
                aria-expanded={open[section.key]}
                className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium">
                {section.title}
                <ChevronDownIcon
                  className={`size-4 transition-transform ${open[section.key] ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {open[section.key] && (
                <div className="px-6 pb-4">{section.content}</div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={scrollToReviews}
            className="hover:bg-muted/50 flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium">
            <span>
              Reviews ({rating.count}) · {rating.average.toFixed(1)}★
            </span>
            <span className="text-muted-foreground text-xs">View all →</span>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default ProductInfo;
