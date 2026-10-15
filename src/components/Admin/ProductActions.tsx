"use client";

import { RotateCcwIcon, Trash2Icon } from "lucide-react";
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

  const handleDelete = async () => {
    setIsPending(true);
    const result = await deleteProduct(id);
    setIsPending(false);
    if (result.ok) {
      toast.add({ title: "Product deleted", type: "success" });
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
            disabled={isPending}
            className="hover:text-destructive">
            <Trash2Icon
              data-icon="inline-start"
              aria-hidden="true"
            />
            Delete
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogTitle>Delete product?</AlertDialogTitle>
        <AlertDialogDescription>
          It will be hidden from the storefront. You can restore it later.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ProductActions;
