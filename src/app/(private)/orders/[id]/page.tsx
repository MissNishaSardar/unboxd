import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CalendarClockIcon, PackageIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import { formatDate, formatPrice } from "@/lib/format";
import { getEstimatedDelivery } from "@/lib/orders/status";
import {
  getPlaceholderPhotoUrl,
  resolveProductImageUrl,
} from "@/lib/placeholder";
import { headers } from "next/headers";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import OrderStatusBadge from "@/components/Orders/OrderStatusBadge";
import OrderTimeline from "@/components/Orders/OrderTimeline";
import CancelOrderButton from "@/components/Orders/CancelOrderButton";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const short = id.slice(0, 8);
  return {
    title: `Order #${short}`,
    description: `Details for order #${short}.`,
  };
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

  const productIds = [...new Set(order.items.map((item) => item.productId))];
  const products =
    productIds.length > 0 ?
      await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          slug: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      })
    : [];
  const imageByProductId = new Map(
    products.map((product) => [
      product.id,
      product.images[0] ?
        resolveProductImageUrl(product.images[0].url, product.slug, 0)
      : getPlaceholderPhotoUrl(product.slug),
    ]),
  );

  const showEta = order.status === "CONFIRMED" || order.status === "SHIPPED";
  const eta = getEstimatedDelivery(order.createdAt);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/orders" />}
          nativeButton={false}
          className="w-fit">
          <ArrowLeftIcon aria-hidden="true" />
          Back to orders
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Order {order.id}
          </h1>
          <p className="text-muted-foreground text-sm">
            Placed {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageIcon
              aria-hidden="true"
              className="text-muted-foreground size-4"
            />
            <span className="text-sm font-medium">Status</span>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <OrderTimeline status={order.status} />
        {showEta && (
          <div className="border-border flex items-center gap-2 border-t pt-4">
            <CalendarClockIcon
              aria-hidden="true"
              className="text-muted-foreground size-4"
            />
            <p className="text-sm">
              Estimated delivery by{" "}
              <span className="font-medium">{formatDate(eta)}</span>
            </p>
          </div>
        )}
        <div className="flex justify-end">
          <CancelOrderButton
            orderId={order.id}
            status={order.status}
          />
        </div>
      </div>

      <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold">Items</h2>
          <Badge variant="secondary">{order.paymentMethod}</Badge>
        </div>
        <ul className="divide-border flex flex-col divide-y">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="bg-muted size-10 shrink-0 overflow-hidden rounded-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      imageByProductId.get(item.productId) ??
                      getPlaceholderPhotoUrl(
                        item.nameSnapshot
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-") || item.productId,
                      )
                    }
                    alt={item.nameSnapshot}
                    className="size-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.nameSnapshot}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Qty {item.quantity}
                  </p>
                </div>
              </div>
              <span className="text-sm tabular-nums">
                {formatPrice(Number(item.priceSnapshot) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {order.address && (
        <div className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-5">
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

      <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
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
        <div className="border-border flex items-center justify-between border-t pt-3">
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
