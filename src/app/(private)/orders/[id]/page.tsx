import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CalendarClockIcon, PackageIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import { formatDate, formatPrice } from "@/lib/format";
import {
  getEstimatedDelivery,
  isWithinReturnWindow,
} from "@/lib/orders/status";
import { CANCEL_REASON_LABELS } from "@/lib/zodSchema";
import { discountBadge } from "@/lib/pricing";
import { getStoreSettings } from "@/server/admin/settings";
import {
  getPlaceholderPhotoUrl,
  resolveProductImageUrl,
} from "@/lib/placeholder";
import { headers } from "next/headers";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import OrderItemImage from "@/components/Orders/OrderItemImage";
import OrderStatusBadge from "@/components/Orders/OrderStatusBadge";
import OrderTimeline from "@/components/Orders/OrderTimeline";
import CancelOrderButton from "@/components/Orders/CancelOrderButton";
import ConfirmReceiptButton from "@/components/Orders/ConfirmReceiptButton";
import RequestReturnButton from "@/components/Orders/RequestReturnButton";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { orderNumber: true },
  });
  const label = order ? `#${order.orderNumber}` : `#${id.slice(0, 8)}`;
  return {
    title: `Order ${label}`,
    description: `Details for order ${label}.`,
  };
}

const OrderPage = async ({ params }: Props) => {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) notFound();

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: true,
      address: true,
    },
  });

  if (!order) notFound();

  const { deliveryDays, returnWindowDays } = await getStoreSettings();

  const productIds = [...new Set(order.items.map((item) => item.productId))];
  const products =
    productIds.length > 0 ?
      await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          slug: true,
          basePrice: true,
          discountPercent: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          variants: { select: { id: true, priceDiff: true } },
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
  const slugByProductId = new Map(
    products.map((product) => [product.id, product.slug]),
  );
  const mrpByVariantId = new Map<string, number>(
    products.flatMap((product) =>
      product.variants.map((variant): [string, number] => [
        variant.id,
        Number(product.basePrice) + Number(variant.priceDiff),
      ]),
    ),
  );
  const mrpByProductId = new Map<string, number>(
    products.map((product): [string, number] => [
      product.id,
      Number(product.basePrice),
    ]),
  );

  const showEta = order.status === "CONFIRMED" || order.status === "SHIPPED";
  const eta = getEstimatedDelivery(order.createdAt, deliveryDays);
  const returnEligible =
    order.status === "DELIVERED" &&
    isWithinReturnWindow(
      order.statusUpdatedAt ?? order.createdAt,
      returnWindowDays,
    );

  const mrpTotal = order.items.reduce((sum, item) => {
    const mrp =
      item.variantId ?
        (mrpByVariantId.get(item.variantId) ??
        mrpByProductId.get(item.productId))
      : mrpByProductId.get(item.productId);
    const unit = mrp ?? Number(item.priceSnapshot);
    return sum + unit * item.quantity;
  }, 0);
  const totalSaved = Math.max(0, mrpTotal - Number(order.subtotal));

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
            <span title={order.id}>Order #{order.orderNumber}</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Placed {formatDate(order.createdAt)} ·{" "}
            <span title={order.id}>{order.id.slice(0, 8)}</span>
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
        {order.status === "CANCELLED" && (
          <div className="border-border border-t pt-4">
            <p className="text-sm font-medium">Cancellation reason</p>
            <p className="text-sm">
              {(
                order.cancelReason != null &&
                order.cancelReason in CANCEL_REASON_LABELS
              ) ?
                CANCEL_REASON_LABELS[
                  order.cancelReason as keyof typeof CANCEL_REASON_LABELS
                ]
              : "No reason given"}
            </p>
            {order.cancelNote && (
              <p className="text-muted-foreground mt-1 text-sm">
                {order.cancelNote}
              </p>
            )}
          </div>
        )}
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
        <div className="flex flex-wrap justify-end gap-2">
          <ConfirmReceiptButton
            orderId={order.id}
            status={order.status}
          />
          <RequestReturnButton
            orderId={order.id}
            status={order.status}
            returnEligible={returnEligible}
          />
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
          {order.items.map((item) => {
            const paid = Number(item.priceSnapshot);
            const mrp: number | undefined =
              item.variantId ?
                (mrpByVariantId.get(item.variantId) ??
                mrpByProductId.get(item.productId))
              : mrpByProductId.get(item.productId);
            const discountPercent =
              mrp != null && mrp > paid ?
                Math.round(((mrp - paid) / mrp) * 100)
              : 0;
            const badge = discountBadge(discountPercent);
            return (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="bg-muted size-10 shrink-0 overflow-hidden rounded-md">
                    <OrderItemImage
                      src={
                        imageByProductId.get(item.productId) ??
                        getPlaceholderPhotoUrl(
                          item.nameSnapshot
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-") || item.productId,
                        )
                      }
                      alt={item.nameSnapshot}
                    />
                  </div>
                  <div className="min-w-0">
                    {slugByProductId.get(item.productId) ?
                      <Link
                        href={`/products/${slugByProductId.get(item.productId)}`}
                        className="truncate text-sm font-medium hover:underline">
                        {item.nameSnapshot}
                      </Link>
                    : <p className="truncate text-sm font-medium">
                        {item.nameSnapshot}
                      </p>
                    }
                    <p className="text-muted-foreground text-xs">
                      Qty {item.quantity} · {formatPrice(paid)} each
                    </p>
                    {badge && mrp != null && (
                      <p className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-muted-foreground text-[11px] tabular-nums line-through">
                          {formatPrice(mrp)}
                        </span>
                        <span className="rounded-full bg-green-600/10 px-1.5 py-0.5 text-[11px] font-semibold text-green-700 dark:text-green-400">
                          {badge}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-sm tabular-nums">
                  {formatPrice(paid * item.quantity)}
                </span>
              </li>
            );
          })}
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
        {totalSaved > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Total savings
            </span>
            <span className="text-sm font-semibold text-green-700 tabular-nums dark:text-green-400">
              -{formatPrice(totalSaved)}
            </span>
          </div>
        )}
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
