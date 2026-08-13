"use client";

import Link from "next/link";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type { CartItem } from "@/lib/cart/atoms";
import { removeCartItem, updateQuantity } from "@/lib/cart/atoms";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/shadcnui/button";

type CartItemRowProps = {
  item: CartItem;
  size?: "sm" | "md";
  onNavigate?: () => void;
};

const CartItemRow = ({ item, size = "md", onNavigate }: CartItemRowProps) => {
  const imageSize = size === "sm" ? "size-16" : "size-24";
  const iconSize = size === "sm" ? "icon-xs" : "icon-sm";

  return (
    <div className="flex gap-4 py-4">
      <div
        className={`relative ${imageSize} shrink-0 overflow-hidden rounded-lg bg-zinc-900`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.name}
          className="size-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/products/${item.slug}`}
              onClick={onNavigate}
              className="line-clamp-2 text-sm font-medium hover:underline">
              {item.name}
            </Link>
            <p className="text-muted-foreground text-xs">{item.variantName}</p>
            <p className="text-muted-foreground mt-1 text-xs tabular-nums">
              {formatPrice(item.price)} each
            </p>
          </div>
          <Button
            variant="ghost"
            size={iconSize}
            aria-label={`Remove ${item.name}`}
            className="hover:text-destructive"
            onClick={() => removeCartItem(item.productId, item.variantId)}>
            <Trash2Icon aria-hidden="true" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size={iconSize}
              aria-label="Decrease quantity"
              disabled={item.quantity <= 1}
              onClick={() =>
                updateQuantity(
                  item.productId,
                  item.variantId,
                  item.quantity - 1,
                )
              }>
              <MinusIcon aria-hidden="true" />
            </Button>
            <span className="w-8 text-center text-sm tabular-nums">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size={iconSize}
              aria-label="Increase quantity"
              disabled={item.quantity >= item.maxStock}
              onClick={() =>
                updateQuantity(
                  item.productId,
                  item.variantId,
                  item.quantity + 1,
                )
              }>
              <PlusIcon aria-hidden="true" />
            </Button>
          </div>
          <p className="text-sm font-semibold tabular-nums">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartItemRow;
