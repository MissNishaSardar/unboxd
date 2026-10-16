"use client";

import { useRef, useState } from "react";
import { useAtomValue } from "jotai";
import {
  ArrowLeftIcon,
  Loader2Icon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  Trash2Icon,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMounted } from "@/hooks/use-mounted";
import {
  cartAtom,
  cartSavingsAtom,
  cartTotalAtom,
  clearCart,
  removeCartItem,
  setManyToCart,
  updateQuantity,
  type CartItem,
} from "@/lib/cart/atoms";
import { formatPrice } from "@/lib/format";
import { withMinDelay } from "@/lib/minDelay";
import { getPlaceholderPhotoUrl } from "@/lib/placeholder";
import type { checkoutType } from "@/lib/zodSchema";
import { placeOrder, quoteCart } from "./actions";
import {
  createUserAddress,
  deleteUserAddress,
  updateUserAddress,
  type UserAddressData,
} from "@/server/user/addresses";
import AddressCard from "@/components/Address/AddressCard";
import AddressForm from "@/components/Address/AddressForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/shadcnui/alert-dialog";
import { Button } from "@/components/shadcnui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import { Separator } from "@/components/shadcnui/separator";
import { toast } from "@/components/shadcnui/toast";

export type BuyNowLine = {
  productId: string;
  sku: string;
  slug: string;
  name: string;
  variantName: string;
  price: number;
  mrp: number;
  image: string;
  maxStock: number;
};

export type ReorderSkippedLine = {
  name: string;
  reason: string;
};

const CheckoutClient = ({
  freeShippingThreshold,
  shippingFlatRate,
  codEnabled,
  returnWindowDays,
  deliveryDate,
  initialAddresses,
  buyNowItem = null,
  reorderOrderId = null,
  reorderItems = null,
  reorderSkipped = [],
  reorderError = null,
}: {
  freeShippingThreshold: number;
  shippingFlatRate: number;
  codEnabled: boolean;
  returnWindowDays: number;
  deliveryDate: string;
  initialAddresses: UserAddressData[];
  buyNowItem?: BuyNowLine | null;
  reorderOrderId?: string | null;
  reorderItems?: CartItem[] | null;
  reorderSkipped?: ReorderSkippedLine[];
  reorderError?: string | null;
}) => {
  const cartItems = useAtomValue(cartAtom);
  const cartTotal = useAtomValue(cartTotalAtom);
  const cartSavings = useAtomValue(cartSavingsAtom);
  const router = useRouter();
  const mounted = useMounted();

  // Buy Now and Buy Again express modes: checkout the resolved lines without
  // touching the saved cart. Lines live in local state so quantity edits
  // never leak into cart atoms. Repeat Buy Again clicks reload the same
  // reorder view instead of growing cart quantities.
  const isBuyNow = buyNowItem !== null;
  const isReorder = reorderOrderId !== null && reorderItems !== null;
  const isExpress = isBuyNow || isReorder;
  const [buyNowLines, setBuyNowLines] = useState<CartItem[]>(
    buyNowItem ? [{ ...buyNowItem, quantity: 1 }] : [],
  );
  const [reorderLines, setReorderLines] = useState<CartItem[]>(
    reorderItems ?? [],
  );
  const items =
    isBuyNow ? buyNowLines
    : isReorder ? reorderLines
    : cartItems;
  const total =
    isBuyNow ?
      buyNowLines.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : isReorder ?
      reorderLines.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : cartTotal;
  const savings =
    isBuyNow ?
      buyNowLines.reduce(
        (sum, item) => sum + Math.max(0, item.mrp - item.price) * item.quantity,
        0,
      )
    : isReorder ?
      reorderLines.reduce(
        (sum, item) => sum + Math.max(0, item.mrp - item.price) * item.quantity,
        0,
      )
    : cartSavings;

  const [addresses, setAddresses] =
    useState<UserAddressData[]>(initialAddresses);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialAddresses.find((a) => a.isDefault)?.id ??
      initialAddresses[0]?.id ??
      null,
  );
  const [mode, setMode] = useState<"list" | "add" | "edit">(
    initialAddresses.length > 0 ? "list" : "add",
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<checkoutType | null>(
    null,
  );
  const [placedOrder, setPlacedOrder] = useState<{
    orderId: string;
    orderNumber: number;
    total: number;
  } | null>(null);
  // Synchronous double-submit guard. State alone lags a tick, so a rapid
  // second click could fire doPlaceOrder twice before the button disables.
  const placingRef = useRef(false);

  // A restored success view must never survive new cart activity. The App
  // Router can serve /checkout from its client-side cache (back button or
  // express re-navigation), bringing the old placedOrder state back with it.
  // Any items in the cart mean a new order is in progress, so the success
  // view only applies to an empty cart, except express modes which never
  // use the cart. Derived during render instead of a syncing effect, which
  // the hooks lint forbids.
  const visiblePlacedOrder =
    isExpress || items.length === 0 ? placedOrder : null;

  const [liveThreshold, setLiveThreshold] = useState(freeShippingThreshold);
  const [liveFlatRate, setLiveFlatRate] = useState(shippingFlatRate);
  const shipping = total >= liveThreshold ? 0 : liveFlatRate;

  const selectedAddress = addresses.find((a) => a.id === selectedId) ?? null;

  const failToast = (error: string) => {
    toast.add({
      title: "Couldn't place your order",
      description:
        error === "OUT_OF_STOCK" ?
          "Some items are out of stock. Review your cart and try again."
        : error === "ORDERING_PAUSED" ?
          "Ordering is paused right now. Please check back soon."
        : error === "SERVER_ERROR" ? "Something went wrong. Please try again."
        : "Please check your details and try again.",
      type: "error",
    });
  };

  const doPlaceOrder = async (payload: {
    address?: checkoutType;
    addressId?: string;
  }) => {
    if (placingRef.current) return;
    placingRef.current = true;
    setPlacing(true);
    try {
      // Timed deals can start or end while checkout is open. Refresh live
      // prices first. When anything moved, sync the new totals, stop, and
      // let the shopper review before placing the order again.
      const quote = await quoteCart(
        items.map((item) => ({ sku: item.sku, quantity: item.quantity })),
      );
      if (quote.ok) {
        if (
          quote.freeShippingThreshold !== liveThreshold ||
          quote.shippingFlatRate !== liveFlatRate
        ) {
          setLiveThreshold(quote.freeShippingThreshold);
          setLiveFlatRate(quote.shippingFlatRate);
        }
        const bySku = new Map(quote.lines.map((line) => [line.sku, line]));
        let removed = 0;
        let priceChanged = false;
        let stockChanged = false;
        const fresh: typeof items = [];
        for (const item of items) {
          const line = bySku.get(item.sku);
          if (!line || !line.available || line.maxStock <= 0) {
            removed += 1;
            continue;
          }
          if (
            line.price === item.price &&
            line.mrp === item.mrp &&
            line.maxStock === item.maxStock
          ) {
            fresh.push(item);
            continue;
          }
          if (line.price !== item.price || line.mrp !== item.mrp) {
            priceChanged = true;
          } else {
            stockChanged = true;
          }
          fresh.push({
            ...item,
            price: line.price,
            mrp: line.mrp,
            maxStock: line.maxStock,
            quantity: Math.min(item.quantity, line.maxStock),
          });
        }
        if (removed > 0 || priceChanged || stockChanged) {
          if (isBuyNow) setBuyNowLines(fresh);
          else if (isReorder) setReorderLines(fresh);
          else {
            const keptSkus = new Set(fresh.map((entry) => entry.sku));
            for (const item of items) {
              if (!keptSkus.has(item.sku)) {
                removeCartItem(item.productId, item.sku);
              }
            }
            if (fresh.length > 0) setManyToCart(fresh);
          }
          toast.add({
            title:
              removed > 0 ? "Some items are unavailable"
              : priceChanged ? "Prices updated"
              : "Stock updated",
            description:
              removed > 0 ?
                "Some items are out of stock or no longer available. Review your order, then place it again."
              : priceChanged ?
                "A deal started or ended while you were checking out. Review the new totals, then place your order again."
              : "Stock changed while you were checking out. Review quantities, then place your order again.",
            type: "info",
          });
          return;
        }
      }
      // Keep the button locked with a spinner for at least a beat, so a
      // fast response does not flash the placing state.
      const result = await withMinDelay(
        placeOrder({
          ...payload,
          cart: items.map((item) => ({
            sku: item.sku,
            quantity: item.quantity,
          })),
        }),
      );
      if (!result.ok) {
        if (result.error === "UNAUTHENTICATED") {
          if (isBuyNow && buyNowItem) {
            router.push(
              `/auth/login?callbackUrl=/checkout?buyNow=${encodeURIComponent(buyNowItem.sku)}`,
            );
          } else if (isReorder && reorderOrderId) {
            router.push(
              `/auth/login?callbackUrl=/checkout?reorder=${encodeURIComponent(reorderOrderId)}`,
            );
          } else {
            router.push("/auth/login?callbackUrl=/checkout");
          }
          return;
        }
        failToast(result.error);
        return;
      }
      if (!isExpress) clearCart();
      setPlacedOrder({
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        total: result.total,
      });
    } finally {
      placingRef.current = false;
      setPlacing(false);
      setConfirmOpen(false);
      setPendingAddress(null);
    }
  };

  const handleAddAddress = async (values: {
    label?: string;
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  }) => {
    const result = await createUserAddress(values);
    if (!result.ok) {
      toast.add({
        title: "Couldn't save the address",
        description: "Please check the fields and try again.",
        type: "error",
      });
      return;
    }
    const created: UserAddressData = {
      id: result.id,
      label: values.label?.trim() ? values.label.trim() : null,
      name: values.name,
      phone: values.phone,
      addressLine: values.addressLine,
      city: values.city,
      state: values.state,
      pincode: values.pincode,
      isDefault: addresses.length === 0,
    };
    setAddresses((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setMode("list");
    toast.add({ title: "Address saved", type: "success" });
  };

  const handleEditAddress = async (values: {
    label?: string;
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  }) => {
    if (!editingId) return;
    const result = await updateUserAddress(editingId, values);
    if (!result.ok) {
      toast.add({
        title: "Couldn't update the address",
        description: "Please check the fields and try again.",
        type: "error",
      });
      return;
    }
    setAddresses((prev) =>
      prev.map((address) =>
        address.id === editingId ?
          {
            ...address,
            label: values.label?.trim() ? values.label.trim() : null,
            name: values.name,
            phone: values.phone,
            addressLine: values.addressLine,
            city: values.city,
            state: values.state,
            pincode: values.pincode,
          }
        : address,
      ),
    );
    setEditingId(null);
    setMode("list");
    toast.add({ title: "Address updated", type: "success" });
  };

  const handleDeleteAddress = async (id: string) => {
    const snapshot = addresses;
    setAddresses((prev) => prev.filter((address) => address.id !== id));
    if (selectedId === id) {
      const remaining = snapshot.filter((address) => address.id !== id);
      setSelectedId(
        remaining.find((a) => a.isDefault)?.id ?? remaining[0]?.id ?? null,
      );
      if (remaining.length === 0) setMode("add");
    }
    const result = await deleteUserAddress(id);
    if (!result.ok) {
      setAddresses(snapshot);
      toast.add({
        title: "Couldn't delete the address",
        description: "Please try again.",
        type: "error",
      });
    }
  };

  const handleNewAddressSubmit = (values: {
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  }) => {
    setPendingAddress(values);
    setConfirmOpen(true);
  };

  const openConfirmForSavedAddress = () => {
    if (!selectedAddress || placing || !codEnabled) return;
    setPendingAddress(null);
    setConfirmOpen(true);
  };

  const handleConfirmPlaceOrder = () => {
    if (pendingAddress) {
      void doPlaceOrder({ address: pendingAddress });
      return;
    }
    if (selectedAddress) {
      void doPlaceOrder({ addressId: selectedAddress.id });
    }
  };

  const confirmAddress = pendingAddress ?? selectedAddress;

  const setLineQuantity = (sku: string, quantity: number) => {
    const clamp = (item: CartItem) => ({
      ...item,
      quantity: Math.max(1, Math.min(quantity, item.maxStock, 99)),
    });
    if (isBuyNow) {
      setBuyNowLines((prev) =>
        prev.map((item) => (item.sku === sku ? clamp(item) : item)),
      );
      return;
    }
    if (isReorder) {
      setReorderLines((prev) =>
        prev.map((item) => (item.sku === sku ? clamp(item) : item)),
      );
    }
  };

  const removeLine = (sku: string) => {
    if (isBuyNow) {
      setBuyNowLines((prev) => prev.filter((item) => item.sku !== sku));
      return;
    }
    if (isReorder) {
      setReorderLines((prev) => prev.filter((item) => item.sku !== sku));
    }
  };

  if (visiblePlacedOrder) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 py-10 text-center">
        <svg
          viewBox="0 0 52 52"
          aria-hidden="true"
          className="success-tick size-16 text-green-600 dark:text-green-400">
          <circle
            className="success-tick-circle"
            cx="26"
            cy="26"
            r="25"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="success-tick-check"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 27l8 8 16-16"
          />
        </svg>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Order placed
        </h1>
        <p className="text-muted-foreground text-sm">
          Arriving by {deliveryDate} · Pay{" "}
          {formatPrice(visiblePlacedOrder.total)} in cash
        </p>
        <p className="text-sm font-medium tabular-nums">
          Order #{visiblePlacedOrder.orderNumber}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button
            render={<Link href={`/orders/${visiblePlacedOrder.orderId}`} />}
            nativeButton={false}>
            View order
          </Button>
          <Button
            variant="outline"
            render={<Link href="/products" />}
            nativeButton={false}>
            Continue shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-col items-start gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          render={
            <Link
              href={
                isBuyNow && buyNowItem ?
                  (`/products/${buyNowItem.slug}` as never)
                : isReorder ?
                  ("/orders" as never)
                : ("/cart" as never)
              }
            />
          }
          nativeButton={false}
          data-icon="inline-start">
          <ArrowLeftIcon aria-hidden="true" />
          {isBuyNow ?
            "Back to product"
          : isReorder ?
            "Back to orders"
          : "Back to cart"}
        </Button>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Checkout
        </h1>
        <p className="text-muted-foreground text-sm">
          {isReorder ?
            "Reordering only these items. Your saved cart stays untouched."
          : "Cash on delivery. Pay in cash when your order arrives."}
        </p>
      </header>

      {isReorder && reorderSkipped.length > 0 && !visiblePlacedOrder && (
        <div
          role="status"
          className="border-border bg-muted/40 rounded-2xl border p-4 text-sm">
          <p className="font-medium">Some items were skipped</p>
          <ul className="text-muted-foreground mt-1 flex flex-col gap-1 text-xs">
            {reorderSkipped.map((line) => (
              <li key={line.name}>
                {line.name}: {line.reason.toLowerCase()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!mounted || items.length === 0 ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingBagIcon />
            </EmptyMedia>
            <EmptyTitle>
              {isReorder ?
                "Nothing available to reorder"
              : "Your cart is empty"}
            </EmptyTitle>
            <EmptyDescription>
              {isReorder ?
                reorderError ?
                  "This order could not be loaded. Please try again from your orders."
                : "All items from this order are out of stock or no longer available."

              : "Add something to your cart before checking out."}
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex flex-wrap justify-center gap-2">
            {isReorder && (
              <Button
                variant="outline"
                render={<Link href="/orders" />}
                nativeButton={false}>
                Back to orders
              </Button>
            )}
            <Button
              render={<Link href="/products" />}
              nativeButton={false}>
              Browse products
            </Button>
          </div>
        </Empty>
      : <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="border-border bg-card flex min-w-0 flex-1 flex-col gap-4 rounded-2xl border p-5">
            <h2 className="font-heading text-sm font-semibold">
              Shipping address
            </h2>

            {mode === "list" && addresses.length > 0 ?
              <div className="flex flex-col gap-3">
                <div
                  role="radiogroup"
                  aria-label="Saved addresses"
                  className="flex flex-col gap-3">
                  {addresses.map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      selected={address.id === selectedId}
                      onSelect={() => setSelectedId(address.id)}
                      actions={
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            data-icon="inline-start"
                            onClick={() => {
                              setEditingId(address.id);
                              setMode("edit");
                            }}>
                            <PencilIcon aria-hidden="true" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            data-icon="inline-start"
                            className="hover:text-destructive"
                            onClick={() =>
                              void handleDeleteAddress(address.id)
                            }>
                            <Trash2Icon aria-hidden="true" />
                            Delete
                          </Button>
                        </>
                      }
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  data-icon="inline-start"
                  onClick={() => setMode("add")}>
                  <PlusIcon aria-hidden="true" />
                  Add new address
                </Button>
              </div>
            : mode === "edit" && editingId ?
              (() => {
                const target = addresses.find((a) => a.id === editingId);
                return (
                  <AddressForm
                    defaultValues={
                      target ?
                        { ...target, label: target.label ?? undefined }
                      : undefined
                    }
                    submitLabel="Save address"
                    onSubmit={handleEditAddress}
                    onCancel={() => {
                      setEditingId(null);
                      setMode(addresses.length > 0 ? "list" : "add");
                    }}
                  />
                );
              })()
            : <AddressForm
                submitId="checkout-address-submit"
                submitLabel={
                  addresses.length > 0 ?
                    "Save and use this address"
                  : "Place order"
                }
                disabled={placing}
                onSubmit={
                  addresses.length > 0 ?
                    handleAddAddress
                  : async (values) => {
                      handleNewAddressSubmit({
                        name: values.name,
                        phone: values.phone,
                        addressLine: values.addressLine,
                        city: values.city,
                        state: values.state,
                        pincode: values.pincode,
                      });
                    }
                }
                onCancel={
                  addresses.length > 0 ? () => setMode("list") : undefined
                }
              />
            }
          </div>

          <aside className="border-border bg-card flex w-full flex-col gap-4 rounded-2xl border p-5 lg:sticky lg:top-24 lg:w-80">
            <h2 className="font-heading text-sm font-semibold">
              Order summary
            </h2>

            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.sku}`}
                  className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="bg-muted size-10 shrink-0 overflow-hidden rounded-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          item.image ||
                          getPlaceholderPhotoUrl(item.slug || item.productId)
                        }
                        alt={item.name}
                        className="size-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.slug ?
                        <Link
                          href={`/products/${item.slug}`}
                          className="line-clamp-2 text-sm font-medium hover:underline">
                          {item.name}
                        </Link>
                      : <p className="line-clamp-2 text-sm font-medium">
                          {item.name}
                        </p>
                      }
                      <p className="text-muted-foreground text-xs">
                        {item.variantName}
                      </p>
                      <div className="flex items-center gap-1 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          aria-label={`Decrease quantity of ${item.name}`}
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            isExpress ?
                              setLineQuantity(item.sku, item.quantity - 1)
                            : updateQuantity(
                                item.productId,
                                item.sku,
                                item.quantity - 1,
                              )
                          }>
                          <MinusIcon aria-hidden="true" />
                        </Button>
                        <span className="w-7 text-center text-xs tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          aria-label={`Increase quantity of ${item.name}`}
                          disabled={item.quantity >= item.maxStock}
                          onClick={() =>
                            isExpress ?
                              setLineQuantity(item.sku, item.quantity + 1)
                            : updateQuantity(
                                item.productId,
                                item.sku,
                                item.quantity + 1,
                              )
                          }>
                          <PlusIcon aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Remove ${item.name} from order`}
                          className="hover:text-destructive"
                          onClick={() =>
                            isExpress ?
                              removeLine(item.sku)
                            : removeCartItem(item.productId, item.sku)
                          }>
                          <Trash2Icon aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <Separator />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Subtotal</span>
                <span className="text-sm font-medium tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>
              {savings > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Total savings
                  </span>
                  <span className="text-sm font-semibold text-green-700 tabular-nums dark:text-green-400">
                    You save {formatPrice(savings)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Shipping</span>
                <span className="text-sm font-medium tabular-nums">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatPrice(total + shipping)}
              </span>
            </div>

            {mode === "list" && (
              <>
                <Button
                  type="button"
                  size="lg"
                  disabled={
                    placing ||
                    !codEnabled ||
                    items.length === 0 ||
                    !selectedAddress
                  }
                  onClick={openConfirmForSavedAddress}>
                  Place order
                </Button>

                <p className="text-muted-foreground text-center text-xs">
                  COD orders cannot be edited after placement.
                </p>
              </>
            )}

            {!codEnabled && (
              <p
                role="alert"
                className="text-destructive text-center text-xs">
                Ordering is paused right now. Please check back soon.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <TruckIcon
                  aria-hidden="true"
                  className="text-primary size-4"
                />
                Cash on delivery, arriving by {deliveryDate}
              </div>
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
                Free returns within {returnWindowDays} days
              </div>
            </div>
          </aside>
        </div>
      }
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open && placing) return;
          setConfirmOpen(open);
          if (!open) setPendingAddress(null);
        }}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm your order?</AlertDialogTitle>
          <AlertDialogDescription>
            Review items, total and delivery address before placing this cash on
            delivery order. COD orders cannot be edited after placement.
          </AlertDialogDescription>
          <div className="flex max-h-72 flex-col gap-4 overflow-y-auto rounded-md border p-3">
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.sku}`}
                  className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.variantName} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-border flex flex-col gap-1 border-t pt-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatPrice(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="tabular-nums">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatPrice(total + shipping)}
                </span>
              </div>
            </div>
            {confirmAddress && (
              <div className="border-border border-t pt-3 text-sm">
                <p className="font-medium">Deliver to</p>
                <p className="mt-1 font-semibold">{confirmAddress.name}</p>
                <p className="text-muted-foreground">
                  {confirmAddress.addressLine}, {confirmAddress.city},{" "}
                  {confirmAddress.state} {confirmAddress.pincode}
                </p>
                <p className="text-muted-foreground tabular-nums">
                  +91 {confirmAddress.phone}
                </p>
              </div>
            )}
            <p className="text-muted-foreground text-xs">
              Cash on delivery, arriving by {deliveryDate}. Free returns within{" "}
              {returnWindowDays} days.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={placing}>
              Review order
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={placing || !confirmAddress || items.length === 0}
              onClick={handleConfirmPlaceOrder}>
              {placing && (
                <Loader2Icon
                  aria-hidden="true"
                  className="animate-spin"
                />
              )}
              {placing ? "Placing order" : "Confirm order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CheckoutClient;
