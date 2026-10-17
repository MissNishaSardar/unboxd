"use client";

import { EyeOffIcon, RotateCcwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { deleteProduct, restoreProduct } from "@/server/admin/catalog";

const ProductActions = ({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleDeactivate = async () => {
    setIsPending(true);
    const result = await deleteProduct(id);
    setIsPending(false);
    if (result.ok) {
      toast.add({ title: "Product deactivated", type: "success" });
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const handleRestore = async () => {
    setIsPending(true);
    const result = await restoreProduct(id);
    setIsPending(false);
    if (result.ok) {
      toast.add({ title: "Product restored", type: "success" });
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  if (!isActive) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        disabled={isPending}>
        <RotateCcwIcon
          data-icon="inline-start"
          aria-hidden="true"
        />
        Restore
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}>
            <EyeOffIcon
              data-icon="inline-start"
              aria-hidden="true"
            />
            Deactivate
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogTitle>Deactivate product?</AlertDialogTitle>
        <AlertDialogDescription>
          It will be inactive and hidden from the storefront. You can restore it
          later.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeactivate}>
            Deactivate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ProductActions;
