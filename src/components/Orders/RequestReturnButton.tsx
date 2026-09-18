"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RotateCcwIcon } from "lucide-react";
import { withMinDelay } from "@/lib/minDelay";
import { requestReturn } from "@/server/order-actions";
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

const RequestReturnButton = ({
  orderId,
  status,
  returnEligible,
}: {
  orderId: string;
  status: string;
  returnEligible: boolean;
}) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  if (status !== "DELIVERED" || !returnEligible) return null;

  const handleReturn = async () => {
    setIsPending(true);
    const result = await withMinDelay(requestReturn(orderId));
    setIsPending(false);
    if (result.ok) {
      toast.add({ title: "Return requested", type: "success" });
      router.refresh();
    } else if (result.error === "RETURN_WINDOW_EXPIRED") {
      toast.add({
        title: "The return window for this order has expired",
        type: "error",
      });
      router.refresh();
    } else if (result.error === "INVALID_TRANSITION") {
      toast.add({
        title: "This order can no longer be returned",
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
            variant="outline"
            disabled={isPending}>
            <RotateCcwIcon
              data-icon="inline-start"
              aria-hidden="true"
            />
            Request return
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogTitle>Request a return?</AlertDialogTitle>
        <AlertDialogDescription>
          Stock will be restored for the returned items. This action cannot be
          undone.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep order</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleReturn}>
            Request return
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RequestReturnButton;
