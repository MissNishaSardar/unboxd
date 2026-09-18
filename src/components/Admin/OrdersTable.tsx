"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2Icon,
  EyeIcon,
  TruckIcon,
  XCircleIcon,
} from "lucide-react";
import type { AdminOrderRow } from "@/server/admin/orders";
import { bulkUpdateOrderStatus } from "@/server/admin/order-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcnui/alert-dialog";
import { Button } from "@/components/shadcnui/button";
import { Badge } from "@/components/shadcnui/badge";
import { Card, CardContent } from "@/components/shadcnui/card";
import { Checkbox } from "@/components/shadcnui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import { toast } from "@/components/shadcnui/toast";
import { formatDate, formatPrice } from "@/lib/format";
import { withMinDelay } from "@/lib/minDelay";
import { CANCEL_REASON_LABELS } from "@/lib/zodSchema";
import type { cancelReasonType } from "@/lib/zodSchema";
import { cancelReasonSchema } from "@/lib/zodSchema";
import { cn } from "@/lib/utils";
import OrderStatusBadge from "@/components/Orders/OrderStatusBadge";

const OrdersTable = ({ orders }: { orders: AdminOrderRow[] }) => {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, setIsPending] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<cancelReasonType | null>(
    null,
  );

  const allSelected = orders.length > 0 && selected.size === orders.length;

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(orders.map((order) => order.id)) : new Set());
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulk = async (
    status: "SHIPPED" | "DELIVERED" | "CANCELLED",
    reason?: cancelReasonType | null,
  ) => {
    if (status === "CANCELLED" && !reason) {
      toast.add({ title: "Please choose a reason", type: "error" });
      return;
    }
    setIsPending(true);
    const result = await withMinDelay(
      bulkUpdateOrderStatus({
        orderIds: [...selected],
        status,
        ...(reason ? { reason } : {}),
      }),
    );
    setIsPending(false);
    if (result.ok) {
      toast.add({
        title: `${result.updated} order${result.updated === 1 ? "" : "s"} ${
          status === "SHIPPED" ? "shipped"
          : status === "DELIVERED" ? "delivered"
          : "cancelled"
        }`,
        type: "success",
      });
      if (result.skipped > 0) {
        toast.add({
          title: `${result.skipped} skipped (invalid transition)`,
          type: "info",
        });
      }
      setSelected(new Set());
      setCancelReason(null);
      setCancelOpen(false);
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && (
        <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
          <p className="text-sm">{selected.size} selected</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulk("SHIPPED")}
              disabled={isPending}>
              <TruckIcon
                data-icon="inline-start"
                aria-hidden="true"
              />
              Mark shipped
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}>
                    <CheckCircle2Icon
                      data-icon="inline-start"
                      aria-hidden="true"
                    />
                    Mark delivered
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogTitle>
                  Mark selected orders as delivered?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Only shipped orders will be updated. Orders in other statuses
                  will be skipped.
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep orders</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleBulk("DELIVERED")}>
                    Mark delivered
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog
              open={cancelOpen}
              onOpenChange={(next) => {
                setCancelOpen(next);
                if (!next) setCancelReason(null);
              }}>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isPending}>
                    <XCircleIcon
                      data-icon="inline-start"
                      aria-hidden="true"
                    />
                    Cancel
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogTitle>Cancel selected orders?</AlertDialogTitle>
                <AlertDialogDescription>
                  Stock will be restored for the cancelled orders. Orders that
                  can&apos;t be cancelled will be skipped. Choose a reason for
                  the records.
                </AlertDialogDescription>
                <div
                  role="radiogroup"
                  aria-label="Cancellation reason"
                  className="flex flex-col gap-1.5">
                  {cancelReasonSchema.options.map((value) => (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors",
                        cancelReason === value ?
                          "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50",
                      )}>
                      <input
                        type="radio"
                        name="bulk-cancel-reason"
                        value={value}
                        checked={cancelReason === value}
                        onChange={() => setCancelReason(value)}
                        disabled={isPending}
                        className="size-4 accent-current"
                      />
                      {CANCEL_REASON_LABELS[value]}
                    </label>
                  ))}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => {
                      setCancelOpen(false);
                      setCancelReason(null);
                    }}>
                    Keep orders
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => handleBulk("CANCELLED", cancelReason)}>
                    Cancel orders
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <CardContent className="p-0 sm:p-6">
          <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:overflow-visible sm:px-0">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => toggleAll(checked === true)}
                      aria-label="Select all orders"
                    />
                  </TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cancel reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(order.id)}
                        onCheckedChange={() => toggle(order.id)}
                        aria-label={`Select order ${order.id}`}
                      />
                    </TableCell>
                    <TableCell className="max-w-40">
                      <p
                        className="truncate text-sm font-medium"
                        title={order.id}>
                        #{order.orderNumber}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="truncate text-sm font-medium">
                        {order.customerName}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {order.customerEmail}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {order.thumbnails.map((src) => (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              key={src}
                              src={src}
                              alt=""
                              aria-hidden="true"
                              className="border-background size-7 rounded-full border-2 object-cover"
                            />
                          ))}
                        </div>
                        <span className="tabular-nums">{order.itemCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{order.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="max-w-44">
                      {order.status === "CANCELLED" ?
                        <p
                          className="truncate text-xs"
                          title={order.cancelReason ?? undefined}>
                          {(
                            order.cancelReason != null &&
                            order.cancelReason in CANCEL_REASON_LABELS
                          ) ?
                            CANCEL_REASON_LABELS[
                              order.cancelReason as keyof typeof CANCEL_REASON_LABELS
                            ]
                          : "No reason given"}
                        </p>
                      : <span className="text-muted-foreground text-xs">-</span>
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button
                          render={
                            <Link href={`/admin/orders/${order.id}` as Route} />
                          }
                          nativeButton={false}
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`View order ${order.id}`}>
                          <EyeIcon aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersTable;
