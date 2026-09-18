"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcwIcon } from "lucide-react";
import { withMinDelay } from "@/lib/minDelay";
import { getBuyAgainItems } from "@/server/order-actions";
import { setManyToCart } from "@/lib/cart/atoms";
import { Button } from "@/components/shadcnui/button";
import { toast } from "@/components/shadcnui/toast";

const BuyAgainButton = ({ orderId }: { orderId: string }) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleBuyAgain = async (
    event: React.MouseEvent | React.KeyboardEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (isPending) return;
    setIsPending(true);
    const result = await withMinDelay(getBuyAgainItems(orderId));
    setIsPending(false);
    if (!result.ok) {
      toast.add({ title: "Something went wrong", type: "error" });
      return;
    }
    if (result.items.length > 0) {
      setManyToCart(result.items);
      for (const skipped of result.skipped) {
        toast.add({
          title: `${skipped.name}: ${skipped.reason.toLowerCase()}`,
          type: "info",
        });
      }
      router.push("/checkout");
    } else {
      for (const skipped of result.skipped) {
        toast.add({
          title: `${skipped.name}: ${skipped.reason.toLowerCase()}`,
          type: "info",
        });
      }
      toast.add({ title: "Nothing available to reorder", type: "info" });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBuyAgain}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          handleBuyAgain(event);
        }
      }}
      disabled={isPending}
      aria-label="Buy again">
      <RotateCcwIcon
        data-icon="inline-start"
        aria-hidden="true"
      />
      {isPending ? "Adding..." : "Buy again"}
    </Button>
  );
};

export default BuyAgainButton;
