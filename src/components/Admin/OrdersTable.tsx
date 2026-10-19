"use client";

/* eslint-disable react-hooks/set-state-in-effect -- clearing row selection after filter or sort change is intentional */
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { RowSelectionState } from "@tanstack/react-table";
import { CheckCircle2Icon, TruckIcon, XCircleIcon } from "lucide-react";
import type { AdminOrderRow } from "@/server/admin/orders";
import { bulkUpdateOrderStatus } from "@/server/admin/order-actions";
import DataTable from "@/components/Admin/DataTable";
import OrdersFilters from "@/components/Admin/OrdersFilters";
import { getOrdersColumns } from "@/components/Admin/OrdersColumns";
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
import { toast } from "@/components/shadcnui/toast";
import { withMinDelay } from "@/lib/minDelay";
import { ADMIN_CANCEL_REASON_LABELS } from "@/lib/zodSchema";
import { adminCancelReasonSchema } from "@/lib/zodSchema";
import type { adminCancelReasonType } from "@/lib/zodSchema";
import { cn } from "@/lib/utils";

const urlSortToSortingState = (urlSort: string): SortingState => {
  if (urlSort === "date_asc") return [{ id: "createdAt", desc: false }];
  return [{ id: "createdAt", desc: true }];
};

const OrdersTable = ({
  orders,
  total,
  statusCounts,
}: {
  orders: AdminOrderRow[];
  total: number;
  statusCounts: Record<string, number>;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetKey = searchParams.toString();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isPending, setIsPending] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] =
    useState<adminCancelReasonType | null>(null);

  useEffect(() => {
    setRowSelection({});
  }, [resetKey]);

  const urlSort = searchParams.get("sort") ?? "date_desc";
  const sorting = useMemo(() => urlSortToSortingState(urlSort), [urlSort]);

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    if (next.length === 0) return;
    const { desc } = next[0];
    const nextUrlSort = desc ? "date_desc" : "date_asc";
    const params = new URLSearchParams(searchParams.toString());
    if (nextUrlSort === "date_desc") params.delete("sort");
    else params.set("sort", nextUrlSort);
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `/admin/orders?${query}` : "/admin/orders");
  };

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id] === true),
    [rowSelection],
  );

  const columns = useMemo(() => getOrdersColumns(), []);

  const handleBulk = async (
    status: "SHIPPED" | "DELIVERED" | "CANCELLED",
    reason?: adminCancelReasonType | null,
  ) => {
    if (status === "CANCELLED" && !reason) {
      toast.add({ title: "Please choose a reason", type: "error" });
      return;
    }
    setIsPending(true);
    const result = await withMinDelay(
      bulkUpdateOrderStatus({
        orderIds: selectedIds,
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
      setRowSelection({});
      setCancelReason(null);
      setCancelOpen(false);
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const toolbar = (
    <div className="flex flex-col gap-3">
      <OrdersFilters
        total={total}
        statusCounts={statusCounts}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs tabular-nums">
          {total} order{total === 1 ? "" : "s"}
          {selectedIds.length > 0 ? ` · ${selectedIds.length} selected` : ""}
        </p>
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
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
                  {adminCancelReasonSchema.options.map((value) => (
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
                      {ADMIN_CANCEL_REASON_LABELS[value]}
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
        )}
      </div>
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={orders}
      getRowId={(row) => row.id}
      sorting={sorting}
      onSortingChange={handleSortingChange}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      toolbar={toolbar}
      emptyTitle="No orders found"
      emptyDescription="Try adjusting your search or filters."
      minWidthClass="min-w-[920px]"
    />
  );
};

export default OrdersTable;
