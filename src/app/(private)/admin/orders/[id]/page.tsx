import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import OrderStatusActions from "@/components/Admin/OrderStatusActions";
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/admin/orders" />}
            nativeButton={false}
            className="w-fit">
            <ArrowLeftIcon aria-hidden="true" />
            Back to orders
          </Button>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Order {order.id}
          </h1>
          <p className="text-muted-foreground text-sm">
            Placed {formatDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <OrderStatusActions
        orderId={order.id}
        status={order.status}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline status={order.status} />
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
              <p className="text-sm font-medium">{order.user.name}</p>
              <p className="text-muted-foreground text-sm">
                {order.user.email}
              </p>
            </CardContent>
          </Card>

          {order.address && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {order.address.name}
                  <br />
                  {order.address.addressLine}, {order.address.city}{" "}
                  {order.address.pincode}
                  <br />
                  {order.address.phone}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Items</CardTitle>
          <Badge variant="secondary">{order.paymentMethod}</Badge>
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
                      {item.imageUrl && (
                        <div className="size-10 shrink-0 overflow-hidden rounded-md bg-zinc-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.nameSnapshot}
                            className="size-full object-cover"
                          />
                        </div>
                      )}
                      {item.nameSnapshot}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.sku ?? "—"}
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
