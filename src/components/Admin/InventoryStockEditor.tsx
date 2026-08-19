"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateVariantStock } from "@/server/admin/catalog";
import { Button } from "@/components/shadcnui/button";
import { Field, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { toast } from "@/components/shadcnui/toast";

const InventoryStockEditor = ({
  variantId,
  stock,
}: {
  variantId: string;
  stock: number;
}) => {
  const router = useRouter();
  const [value, setValue] = useState(String(stock));
  const [isPending, setIsPending] = useState(false);

  const dirty = value !== String(stock);

  const handleSave = async () => {
    setIsPending(true);
    const result = await updateVariantStock(variantId, { stock: value });
    setIsPending(false);
    if (result.ok) {
      toast.add({ title: "Stock updated", type: "success" });
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  return (
    <Field
      orientation="horizontal"
      className="justify-end">
      <FieldLabel
        htmlFor={`stock-${variantId}`}
        className="sr-only">
        Stock count
      </FieldLabel>
      <Input
        id={`stock-${variantId}`}
        type="number"
        min="0"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="w-24"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        disabled={!dirty || isPending}>
        Save
      </Button>
    </Field>
  );
};

export default InventoryStockEditor;
