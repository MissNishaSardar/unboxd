"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserRoundIcon } from "lucide-react";
import { stopImpersonating } from "@/server/admin/user-actions";
import { Button } from "@/components/shadcnui/button";
import { toast } from "@/components/shadcnui/toast";

const ImpersonationBanner = ({ name }: { name: string }) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleStop = async () => {
    setIsPending(true);
    const result = await stopImpersonating();
    setIsPending(false);
    if (result.ok) {
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  return (
    <div className="bg-primary text-primary-foreground flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
      <p className="flex items-center gap-2">
        <UserRoundIcon
          data-icon="inline-start"
          aria-hidden="true"
        />
        Viewing as {name}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={handleStop}
        disabled={isPending}>
        Stop impersonating
      </Button>
    </div>
  );
};

export default ImpersonationBanner;
