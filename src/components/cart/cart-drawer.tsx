"use client";

import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCartIcon, XIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cartAtom, cartDrawerOpenAtom, cartTotalAtom } from "@/lib/cart/atoms";
import { formatPrice } from "@/lib/format";
import CartItemRow from "@/components/cart/cart-item-row";
import { Button } from "@/components/shadcnui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import { Separator } from "@/components/shadcnui/separator";

const CartDrawer = () => {
  const open = useAtomValue(cartDrawerOpenAtom);
  const setOpen = useSetAtom(cartDrawerOpenAtom);
  const items = useAtomValue(cartAtom);
  const total = useAtomValue(cartTotalAtom);
  const { data: session } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const handleCheckout = () => {
    setOpen(false);
    router.push(session ? "/checkout" : "/auth/login?callbackUrl=/checkout");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-label="Shopping cart"
            className="bg-background fixed top-0 right-0 z-50 flex h-dvh w-full max-w-md flex-col border-l shadow-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}>
            <header className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-heading text-lg font-semibold">Your cart</h2>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close cart"
                onClick={() => setOpen(false)}>
                <XIcon aria-hidden="true" />
              </Button>
            </header>

            {items.length === 0 ?
              <div className="flex flex-1 items-center justify-center p-6">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ShoppingCartIcon />
                    </EmptyMedia>
                    <EmptyTitle>Your cart is empty</EmptyTitle>
                    <EmptyDescription>
                      Add something from the catalog and it will show up here.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </div>
            : <>
                <ul className="flex-1 divide-y overflow-y-auto px-4">
                  {items.map((item) => (
                    <li key={`${item.productId}-${item.variantId}`}>
                      <CartItemRow
                        item={item}
                        size="sm"
                        onNavigate={() => setOpen(false)}
                      />
                    </li>
                  ))}
                </ul>

                <footer className="flex flex-col gap-3 border-t px-4 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Subtotal
                    </span>
                    <span className="text-lg font-semibold tabular-nums">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      render={<Link href="/cart" />}
                      nativeButton={false}
                      onClick={() => setOpen(false)}>
                      View cart
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleCheckout}>
                      Checkout
                    </Button>
                  </div>
                </footer>
              </>
            }
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
