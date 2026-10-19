import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  XCircleIcon,
} from "lucide-react";
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
import OrderItemsTable from "@/components/Admin/OrderItemsTable";
import OrderStatusRail from "@/components/Admin/OrderStatusRail";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { formatDate, formatPrice } from "@/lib/format";
import { requireAdminPage } from "@/lib/guard";
import { cn } from "@/lib/utils";
import { getStoreSettings } from "@/server/admin/settings";
import { getAdminOrderDetail } from "@/server/admin/orders";

const getPaymentState = (status: string) => {
  if (status === "DELIVERED") {
    return {
      label: "Collected",
      Icon: CheckCircle2Icon,
      dot: "bg-emerald-500",
      strip:
        "border-emerald-500/40 bg-emerald-500/[0.06] dark:bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-400",
      note: "Cash collected when the order was delivered",
    };
  }
  if (status === "CANCELLED" || status === "RETURNED") {
    return {
      label: "Not due",
      Icon: XCircleIcon,
      dot: "bg-muted-foreground",
      strip: "border-border bg-muted/40",
      text: "text-muted-foreground",
      note: "Order closed, there is nothing to collect",
    };
  }
  return {
    label: "Pending",
    Icon: ClockIcon,
    dot: "bg-amber-500",
    strip: "border-amber-500/40 bg-amber-500/[0.06] dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    note: "Collect the cash amount on delivery",
  };
};

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
  const payment = getPaymentState(order.status);

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
        </div>
      </div>

      <div data-print-hidden>
        <OrderStatusActions
          orderId={order.id}
          status={order.status}
        />
      </div>

      <OrderStatusRail
        status={order.status}
        createdAt={order.createdAt}
        statusUpdatedAt={order.statusUpdatedAt}
        deliveryDays={deliveryDays}
        customerId={order.user.id}
        cancellation={order.cancellation}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <div className="flex flex-col gap-1">
              <Link
                href={
                  `/admin/users?search=${encodeURIComponent(order.user.email)}` as Route
                }
                className="group font-heading hover:text-primary flex w-fit items-center gap-1 text-lg font-medium transition-colors">
                {order.user.name}
                <ChevronRightIcon
                  aria-hidden="true"
                  className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <p className="text-muted-foreground text-sm">
                {order.user.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="border-border/80 bg-muted/50 text-muted-foreground rounded-full border px-3 py-1 text-xs">
                {order.customerStats.orderCount} order
                {order.customerStats.orderCount === 1 ? "" : "s"}
              </span>
              <span className="border-border/80 bg-muted/50 text-muted-foreground rounded-full border px-3 py-1 text-xs">
                {formatPrice(order.customerStats.lifetimeValue)} lifetime
              </span>
            </div>

            {order.address ?
              <div className="border-border/80 bg-muted/40 rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                      <MapPinIcon
                        aria-hidden="true"
                        className="size-3.5"
                      />
                      Deliver to
                    </span>
                    <p className="text-sm">{order.address.addressLine}</p>
                    <p className="text-muted-foreground text-sm">
                      {order.address.city}
                      {order.address.state ?
                        `, ${order.address.state}`
                      : ""}{" "}
                      {order.address.pincode}
                    </p>
                    <p className="text-sm font-medium tabular-nums">
                      {order.address.phone}
                    </p>
                  </div>
                  <CopyAddressButton
                    text={`${order.address.name}\n${order.address.addressLine}, ${order.address.city} ${order.address.pincode}\n${order.address.phone}`}
                  />
                </div>
              </div>
            : <p className="text-muted-foreground rounded-2xl border border-dashed p-4 text-sm">
                No address on file
              </p>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Order total
              </span>
              <span className="font-heading text-3xl font-semibold tabular-nums">
                {formatPrice(order.total)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-sm">Subtotal</span>
                <span className="text-sm tabular-nums">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-sm">Shipping</span>
                <span className="text-sm tabular-nums">
                  {Number(order.shipping) === 0 ?
                    "Free"
                  : formatPrice(order.shipping)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-sm">Method</span>
                <Badge variant="secondary">{order.paymentMethod}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-sm">
                  Collection
                </span>
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span
                    aria-hidden="true"
                    className={cn("size-2 rounded-full", payment.dot)}
                  />
                  {payment.label}
                </span>
              </div>
            </div>

            <div
              className={cn(
                "mt-auto flex items-center gap-2 rounded-2xl border px-4 py-3",
                payment.strip,
              )}>
              <payment.Icon
                aria-hidden="true"
                className={cn("size-4 shrink-0", payment.text)}
              />
              <span className={cn("text-xs font-medium", payment.text)}>
                {payment.note}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <OrderItemsTable items={order.items} />
    </div>
  );
};

export default AdminOrderDetailPage;
