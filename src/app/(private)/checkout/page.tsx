"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAtomValue } from "jotai";
import {
  ArrowLeftIcon,
  Loader2Icon,
  RotateCcwIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useMounted } from "@/hooks/use-mounted";
import { cartAtom, cartTotalAtom, clearCart } from "@/lib/cart/atoms";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT_RATE,
} from "@/lib/cart/shipping";
import { formatPrice } from "@/lib/format";
import { checkoutSchema, checkoutType } from "@/lib/zodSchema";
import { placeOrder } from "./actions";
import { Button } from "@/components/shadcnui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { Separator } from "@/components/shadcnui/separator";
import { toast } from "@/components/shadcnui/toast";

const CheckoutPage = () => {
  const items = useAtomValue(cartAtom);
  const total = useAtomValue(cartTotalAtom);
  const router = useRouter();
  const mounted = useMounted();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<checkoutType>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      phone: "",
      addressLine: "",
      city: "",
      pincode: "",
    },
    mode: "all",
  });

  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;

  const onSubmit = async (values: checkoutType) => {
    const result = await placeOrder({
      address: values,
      cart: items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    });

    if (!result.ok) {
      if (result.error === "UNAUTHENTICATED") {
        router.push("/auth/login?callbackUrl=/checkout");
        return;
      }
      toast.add({
        title: "Couldn't place your order",
        description:
          result.error === "OUT_OF_STOCK" ?
            "Some items are out of stock. Review your cart and try again."
          : result.error === "SERVER_ERROR" ?
            "Something went wrong. Please try again."
          : "Please check your details and try again.",
        type: "error",
      });
      return;
    }

    clearCart();
    router.push(`/orders/${result.orderId}`);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Checkout
        </h1>
        <p className="text-muted-foreground text-sm">
          Cash on delivery, no prepayment needed.
        </p>
      </header>

      {!mounted || items.length === 0 ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingCartIcon />
            </EmptyMedia>
            <EmptyTitle>Your cart is empty</EmptyTitle>
            <EmptyDescription>
              Add something to your cart before checking out.
            </EmptyDescription>
          </EmptyHeader>
          <Button
            render={<Link href="/products" />}
            nativeButton={false}>
            Browse products
          </Button>
        </Empty>
      : <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm font-semibold">
                Shipping address
              </h2>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/cart" />}
                nativeButton={false}
                data-icon="inline-start">
                <ArrowLeftIcon aria-hidden="true" />
                Back to cart
              </Button>
            </div>

            <FieldGroup>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Full name</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Jane Doe"
                      autoComplete="name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="phone"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="tel"
                      placeholder="9876543210"
                      autoComplete="tel"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="addressLine"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Address</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="House no, street, area"
                      autoComplete="street-address"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="city"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>City</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Bengaluru"
                      autoComplete="address-level2"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="pincode"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Pincode</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      inputMode="numeric"
                      placeholder="560001"
                      autoComplete="postal-code"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <aside className="flex w-full flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 lg:sticky lg:top-24 lg:w-80">
            <h2 className="font-heading text-sm font-semibold">
              Order summary
            </h2>

            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.variantId}`}
                  className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.variantName} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums">
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

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              )}
              Place order
            </Button>

            <div className="flex flex-col gap-2">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <TruckIcon
                  aria-hidden="true"
                  className="text-primary size-4"
                />
                Cash on delivery
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
                Free returns within 14 days
              </div>
            </div>
          </aside>
        </form>
      }
    </div>
  );
};

export default CheckoutPage;
