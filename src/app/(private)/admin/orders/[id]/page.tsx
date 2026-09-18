import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import prisma from "@/lib/dbClient/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { orderNumber: true },
  });
  const label = order ? `#${order.orderNumber}` : `#${id.slice(0, 8)}`;
  return {
    title: `Order ${label}`,
    description: `Manage order ${label}.`,
  };
}
import OrderStatusActions from "@/components/Admin/OrderStatusActions";
import CopyAddressButton from "@/components/Admin/CopyAddressButton";
import PrintOrderButton from "@/components/Admin/PrintOrderButton";
import OrderStatusBadge from "@/components/Orders/OrderStatusBadge";
import OrderTimeline from "@/components/Orders/OrderTimeline";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { Separator } from "@/components/shadcnui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import { formatDate, formatPrice } from "@/lib/format";
import { requireAdminPage } from "@/lib/guard";
import { CANCEL_REASON_LABELS } from "@/lib/zodSchema";
import { getEstimatedDelivery } from "@/lib/orders/status";
import { getStoreSettings } from "@/server/admin/settings";
import { getAdminOrderDetail } from "@/server/admin/orders";

const AdminOrderDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  await requireAdminPage();

  const { id } = await params;
  const order = await getAdminOrderDetail(id);
  if (!order) notFound();
  const { deliveryDays } = await getStoreSettings();

  const showEta = order.status === "CONFIRMED" || order.status === "SHIPPED";
  const eta = getEstimatedDelivery(new Date(order.createdAt), deliveryDays);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/admin/orders" />}
            nativeButton={false}
            className="w-fit"
            data-print-hidden>
            <ArrowLeftIcon aria-hidden="true" />
            Back to orders
          </Button>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            <span title={order.id}>Order #{order.orderNumber}</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Placed {formatDate(order.createdAt)} ·{" "}
            <span title={order.id}>{order.id.slice(0, 8)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintOrderButton />
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div data-print-hidden>
        <OrderStatusActions
          orderId={order.id}
          status={order.status}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline status={order.status} />
            {showEta && (
              <p className="text-muted-foreground text-xs">
                Estimated delivery by {formatDate(eta)}
              </p>
            )}
            {order.statusUpdatedAt && (
              <p className="text-muted-foreground text-xs">
                Last updated {formatDate(order.statusUpdatedAt)}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={
                  `/admin/users?search=${encodeURIComponent(order.user.email)}` as Route
                }
                className="hover:text-primary text-sm font-medium underline-offset-4 hover:underline">
                {order.user.name}
              </Link>
              <p className="text-muted-foreground text-sm">
                {order.user.email}
              </p>
              <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                {order.customerStats.orderCount} order
                {order.customerStats.orderCount === 1 ? "" : "s"} ·{" "}
                {formatPrice(order.customerStats.lifetimeValue)} lifetime
              </p>
              {order.address && (
                <>
                  <Separator className="my-3" />
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm">
                      {order.address.name}
                      <br />
                      {order.address.addressLine}, {order.address.city}{" "}
                      {order.address.pincode}
                      <br />
                      {order.address.phone}
                    </p>
                    <CopyAddressButton
                      text={`${order.address.name}\n${order.address.addressLine}, ${order.address.city} ${order.address.pincode}\n${order.address.phone}`}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary">{order.paymentMethod}</Badge>
                <Badge
                  variant={
                    order.status === "DELIVERED" ? "default" : "secondary"
                  }
                  className={
                    order.status === "DELIVERED" ?
                      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : (
                      order.status === "CANCELLED" ||
                      order.status === "RETURNED"
                    ) ?
                      "text-muted-foreground"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  }>
                  {order.status === "DELIVERED" ?
                    "Collected"
                  : (
                    order.status === "CANCELLED" || order.status === "RETURNED"
                  ) ?
                    "Not due"
                  : "Pending"}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {order.status === "DELIVERED" ?
                    "Collected"
                  : (
                    order.status === "CANCELLED" || order.status === "RETURNED"
                  ) ?
                    "Amount"
                  : "To collect"}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatPrice(order.total)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {order.cancellation && (
        <Card>
          <CardHeader>
            <CardTitle>Cancellation reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {(
                order.cancellation.reason != null &&
                order.cancellation.reason in CANCEL_REASON_LABELS
              ) ?
                CANCEL_REASON_LABELS[
                  order.cancellation.reason as keyof typeof CANCEL_REASON_LABELS
                ]
              : "No reason given"}
            </p>
            {order.cancellation.note && (
              <p className="text-muted-foreground mt-1 text-sm">
                {order.cancellation.note}
              </p>
            )}
            {order.cancellation.cancelledAt && (
              <p className="text-muted-foreground mt-1 text-xs">
                Cancelled {formatDate(order.cancellation.cancelledAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted size-14 shrink-0 overflow-hidden rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.nameSnapshot}
                          className="size-full object-cover"
                        />
                      </div>
                      <Link
                        href={`/admin/products/${item.productId}/edit` as Route}
                        className="hover:text-primary underline-offset-4 hover:underline">
                        {item.nameSnapshot}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.sku ?? "-"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(item.priceSnapshot)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(Number(item.priceSnapshot) * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-2 pt-4">
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
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrderDetailPage;
