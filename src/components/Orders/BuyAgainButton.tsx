"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/shadcnui/button";

const BuyAgainButton = ({ orderId }: { orderId: string }) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleBuyAgain = () => {
    if (isPending) return;
    setIsPending(true);
    router.push(`/checkout?reorder=${encodeURIComponent(orderId)}`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBuyAgain}
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
