"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EyeIcon, TruckIcon, XCircleIcon } from "lucide-react";
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
import OrderStatusBadge from "@/components/Orders/OrderStatusBadge";

const OrdersTable = ({ orders }: { orders: AdminOrderRow[] }) => {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, setIsPending] = useState(false);

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

  const handleBulk = async (status: "SHIPPED" | "CANCELLED") => {
    setIsPending(true);
    const result = await bulkUpdateOrderStatus({
      orderIds: [...selected],
      status,
    });
    setIsPending(false);
    if (result.ok) {
      toast.add({
        title: `${result.updated} order${result.updated === 1 ? "" : "s"} ${
          status === "SHIPPED" ? "shipped" : "cancelled"
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
                  can&apos;t be cancelled will be skipped.
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep orders</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => handleBulk("CANCELLED")}>
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
            <Table className="min-w-[720px]">
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
                  <TableHead>Status</TableHead>
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
                      <p className="truncate text-sm font-medium">{order.id}</p>
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
                    <TableCell className="tabular-nums">
                      {order.itemCount}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
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
