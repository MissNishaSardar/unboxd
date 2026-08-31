"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRightIcon, RotateCcwIcon, XCircleIcon } from "lucide-react";
import { updateOrderStatus } from "@/server/admin/order-actions";
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
import {
  canTransition,
  getNextStatus,
  getOrderStatusConfig,
} from "@/lib/orders/status";

const OrderStatusActions = ({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleUpdate = async (nextStatus: string) => {
    setIsPending(true);
    const result = await updateOrderStatus(orderId, { status: nextStatus });
    setIsPending(false);
    if (result.ok) {
      toast.add({
        title: `Order marked ${getOrderStatusConfig(result.status).label.toLowerCase()}`,
        type: "success",
      });
      router.refresh();
    } else if (result.error === "INVALID_TRANSITION") {
      toast.add({ title: "Invalid status transition", type: "error" });
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const nextStatus = getNextStatus(status);
  const canCancel = canTransition(status, "CANCELLED");
  const canReturn = canTransition(status, "RETURNED");

  if (!nextStatus && !canCancel && !canReturn) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nextStatus && (
        <Button
          onClick={() => handleUpdate(nextStatus)}
          disabled={isPending}>
          <ArrowRightIcon
            data-icon="inline-start"
            aria-hidden="true"
          />
          Mark as {getOrderStatusConfig(nextStatus).label.toLowerCase()}
        </Button>
      )}
      {canReturn && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="outline"
                disabled={isPending}>
                <RotateCcwIcon
                  data-icon="inline-start"
                  aria-hidden="true"
                />
                Mark returned
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogTitle>Mark order as returned?</AlertDialogTitle>
            <AlertDialogDescription>
              Stock will be restored for the returned items.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep order</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => handleUpdate("RETURNED")}>
                Mark returned
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {canCancel && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                disabled={isPending}>
                <XCircleIcon
                  data-icon="inline-start"
                  aria-hidden="true"
                />
                Cancel order
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              Stock will be restored for the cancelled items.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep order</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => handleUpdate("CANCELLED")}>
                Cancel order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default OrderStatusActions;
