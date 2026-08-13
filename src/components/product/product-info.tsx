"use client";

import { useMemo } from "react";
import { useSetAtom } from "jotai";
import { parseAsString, useQueryState } from "nuqs";
import { ShoppingCartIcon } from "lucide-react";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Field, FieldGroup, FieldTitle } from "@/components/shadcnui/field";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/shadcnui/toggle-group";
import { toast } from "@/components/shadcnui/toast";
import { cartAtom } from "@/lib/cart/atoms";
import { formatPrice } from "@/lib/format";

export type ProductInfoVariant = {
  sku: string;
  name: string;
  priceDiff: string;
  stock: number;
};

const ProductInfo = ({
  productId,
  slug,
  name,
  basePrice,
  priceFrom,
  image,
  variants,
}: {
  productId: string;
  slug: string;
  name: string;
  basePrice: string;
  priceFrom: string;
  image: string;
  variants: ProductInfoVariant[];
}) => {
  const defaultSku = useMemo(
    () =>
      variants.find((variant) => variant.stock > 0)?.sku ?? variants[0]?.sku,
    [variants],
  );
  const [sku, setSku] = useQueryState(
    "variant",
    parseAsString.withDefault(defaultSku ?? ""),
  );
  const setCart = useSetAtom(cartAtom);

  const variant =
    variants.find((candidate) => candidate.sku === sku) ??
    variants.find((candidate) => candidate.sku === defaultSku);

  if (!variant) return null;

  const price = Number(basePrice) + Number(variant.priceDiff);
  const outOfStock = variant.stock === 0;
  const lowStock = !outOfStock && variant.stock <= 5;
  const showsFrom = Number(priceFrom) < price;

  const addToCart = () => {
    setCart((items) => {
      const existing = items.find(
        (item) =>
          item.productId === productId && item.variantId === variant.sku,
      );
      if (existing) {
        return items.map((item) =>
          item.productId === productId && item.variantId === variant.sku ?
            { ...item, quantity: Math.min(item.quantity + 1, item.maxStock) }
          : item,
        );
      }
      return [
        ...items,
        {
          productId,
          variantId: variant.sku,
          slug,
          name,
          variantName: variant.name,
          price,
          image,
          quantity: 1,
          maxStock: variant.stock,
        },
      ];
    });
    toast.add({
      title: "Added to cart",
      description: `${name} · ${variant.name}`,
      type: "success",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {name}
        </h1>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold tabular-nums">
            {formatPrice(price)}
          </p>
          {showsFrom && (
            <p className="text-muted-foreground text-sm">
              from {formatPrice(priceFrom)}
            </p>
          )}
        </div>
        <div>
          {outOfStock ?
            <Badge variant="destructive">Out of Stock</Badge>
          : lowStock ?
            <Badge variant="outline">Only {variant.stock} left</Badge>
          : <Badge>In Stock</Badge>}
        </div>
      </div>

      {variants.length > 1 && (
        <FieldGroup className="gap-3">
          <Field>
            <FieldTitle>Variant</FieldTitle>
            <ToggleGroup
              orientation="vertical"
              className="w-full"
              value={[variant.sku]}
              onValueChange={(values) => {
                const next = values[0];
                if (next) void setSku(next);
              }}>
              {variants.map((candidate) => (
                <ToggleGroupItem
                  key={candidate.sku}
                  value={candidate.sku}
                  variant="outline"
                  disabled={candidate.stock === 0}
                  className="w-full justify-between">
                  <span>{candidate.name}</span>
                  {candidate.stock === 0 ?
                    <span className="text-muted-foreground text-xs">
                      Out of stock
                    </span>
                  : <span className="text-muted-foreground text-xs tabular-nums">
                      {formatPrice(
                        Number(basePrice) + Number(candidate.priceDiff),
                      )}
                    </span>
                  }
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
        </FieldGroup>
      )}

      <Button
        size="lg"
        disabled={outOfStock}
        onClick={addToCart}
        data-icon="inline-start">
        <ShoppingCartIcon aria-hidden="true" />
        {outOfStock ? "Out of Stock" : "Add to Cart"}
      </Button>
    </div>
  );
};

export default ProductInfo;
