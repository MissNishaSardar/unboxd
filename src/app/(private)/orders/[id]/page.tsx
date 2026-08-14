import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2Icon, PackageIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import { formatPrice } from "@/lib/format";
import { headers } from "next/headers";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id} - Unboxd` };
}

const OrderPage = async ({ params }: Props) => {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) notFound();

  const order = await prisma.order.findUnique({
    where: { id, userId: session.user.id },
    include: {
      items: true,
      address: true,
    },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2Icon
          aria-hidden="true"
          className="text-primary size-12"
        />
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Order placed
        </h1>
        <p className="text-muted-foreground text-sm">
          Thanks for your order. We&apos;ll confirm it shortly.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageIcon
              aria-hidden="true"
              className="text-muted-foreground size-4"
            />
            <span className="text-sm font-medium">Order</span>
          </div>
          <span className="text-muted-foreground text-sm">{order.id}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Status</span>
          <Badge variant="secondary">{order.status}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Payment</span>
          <span className="text-sm font-medium">{order.paymentMethod}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <h2 className="font-heading text-sm font-semibold">Items</h2>
        <ul className="flex flex-col divide-y divide-zinc-800">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {item.nameSnapshot}
                </p>
                <p className="text-muted-foreground text-xs">
                  Qty {item.quantity}
                </p>
              </div>
              <span className="text-sm tabular-nums">
                {formatPrice(Number(item.priceSnapshot) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {order.address && (
        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="font-heading text-sm font-semibold">
            Delivery address
          </h2>
          <p className="text-sm">
            {order.address.name}
            <br />
            {order.address.addressLine}, {order.address.city}{" "}
            {order.address.pincode}
            <br />
            {order.address.phone}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Subtotal</span>
          <span className="text-sm tabular-nums">
            {formatPrice(order.subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Shipping</span>
          <span className="text-sm tabular-nums">
            {Number(order.shipping) === 0 ?
              "Free"
            : formatPrice(order.shipping)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-semibold tabular-nums">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          render={<Link href="/products" />}
          nativeButton={false}>
          Continue shopping
        </Button>
      </div>
    </div>
  );
};

export default OrderPage;
