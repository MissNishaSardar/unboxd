"use client";

import { AnimatePresence, motion } from "motion/react";
import { useAtomValue } from "jotai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  Trash2Icon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useMounted } from "@/hooks/use-mounted";
import { cartAtom, cartTotalAtom, clearCart } from "@/lib/cart/atoms";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT_RATE,
} from "@/lib/cart/shipping";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/shadcnui/button";
import CartItemRow from "@/components/Cart/CartItemRow";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import { Separator } from "@/components/shadcnui/separator";

const CartClient = () => {
  const items = useAtomValue(cartAtom);
  const total = useAtomValue(cartTotalAtom);
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const mounted = useMounted();

  const handleCheckout = () => {
    router.push(session ? "/checkout" : "/auth/login?callbackUrl=/checkout");
  };

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const progress = Math.min(1, total / FREE_SHIPPING_THRESHOLD);
  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Your cart
        </h1>
        <p className="text-muted-foreground text-sm">
          {!mounted || items.length === 0 ?
            "Nothing here yet"
          : `${items.length} item${items.length === 1 ? "" : "s"}`}
        </p>
      </header>

      {!mounted || items.length === 0 ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingBagIcon />
            </EmptyMedia>
            <EmptyTitle>Your cart is empty</EmptyTitle>
            <EmptyDescription>
              Browse the catalog and add something you like.
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              render={<Link href="/products" />}
              nativeButton={false}>
              Browse products
            </Button>
            <Button
              variant="outline"
              render={<Link href="/products" />}
              nativeButton={false}>
              Continue shopping
            </Button>
          </div>
        </Empty>
      : <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="border-border bg-card flex min-w-0 flex-1 flex-col rounded-2xl border">
            <div className="flex items-center justify-between px-5 pt-4">
              <h2 className="font-heading text-sm font-semibold">
                Items ({items.length})
              </h2>
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  data-icon="inline-start"
                  onClick={clearCart}>
                  <Trash2Icon aria-hidden="true" />
                  Clear cart
                </Button>
              )}
            </div>
            <ul className="divide-border flex flex-col divide-y px-5">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.li
                    key={`${item.productId}-${item.sku}`}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}>
                    <CartItemRow item={item} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="px-5 pb-4">
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/products" />}
                nativeButton={false}
                data-icon="inline-end">
                Continue shopping
                <ArrowRightIcon aria-hidden="true" />
              </Button>
            </div>
          </div>

          <aside className="border-border bg-card flex w-full flex-col gap-4 rounded-2xl border p-5 lg:sticky lg:top-24 lg:w-80">
            <h2 className="font-heading text-sm font-semibold">
              Order summary
            </h2>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Subtotal</span>
                <span className="text-sm font-medium tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Shipping</span>
                <span className="text-sm font-medium tabular-nums">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {remaining > 0 ?
                  `Add ${formatPrice(remaining)} more for free shipping`
                : "Free shipping unlocked"}
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatPrice(total + shipping)}
              </span>
            </div>

            <Button
              size="lg"
              onClick={handleCheckout}>
              Checkout
            </Button>

            <div className="flex flex-col gap-2">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <ShieldCheckIcon
                  aria-hidden="true"
                  className="text-primary size-4"
                />
                Secure checkout
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <RotateCcwIcon
                  aria-hidden="true"
                  className="text-primary size-4"
                />
                Free returns within 14 days
              </div>
            </div>

            <p className="text-muted-foreground text-center text-xs">
              {session ?
                `Free shipping on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}.`
              : "Sign in at checkout to place your order."}
            </p>
          </aside>
        </div>
      }
    </div>
  );
};

export default CartClient;
