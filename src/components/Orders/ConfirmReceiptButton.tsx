"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2Icon } from "lucide-react";
import { withMinDelay } from "@/lib/minDelay";
import { confirmReceipt } from "@/server/order-actions";
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

const ConfirmReceiptButton = ({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  if (status !== "SHIPPED") return null;

  const handleConfirm = async () => {
    setIsPending(true);
    const result = await withMinDelay(confirmReceipt(orderId));
    setIsPending(false);
    if (result.ok) {
      toast.add({ title: "Order marked as delivered", type: "success" });
      router.refresh();
    } else if (result.error === "INVALID_TRANSITION") {
      toast.add({
        title: "This order can no longer be marked as delivered",
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
          <Button disabled={isPending}>
            <CheckCircle2Icon
              data-icon="inline-start"
              aria-hidden="true"
            />
            I received my order
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogTitle>Confirm receipt?</AlertDialogTitle>
        <AlertDialogDescription>
          This marks the order as delivered and unlocks reviews. This action
          cannot be undone.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Not yet</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Confirm receipt
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmReceiptButton;
