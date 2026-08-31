"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { XCircleIcon } from "lucide-react";
import { cancelOrder } from "@/server/order-actions";
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

const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED"];

const CancelOrderButton = ({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  if (!CANCELLABLE_STATUSES.includes(status)) return null;

  const handleCancel = async () => {
    setIsPending(true);
    const result = await cancelOrder(orderId);
    setIsPending(false);
    if (result.ok) {
      toast.add({ title: "Order cancelled", type: "success" });
      router.refresh();
    } else if (result.error === "INVALID_TRANSITION") {
      toast.add({
        title: "This order can no longer be cancelled",
        type: "error",
      });
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  return (
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
          Stock will be restored for the cancelled items. This action cannot be
          undone.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep order</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleCancel}>
            Cancel order
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelOrderButton;
