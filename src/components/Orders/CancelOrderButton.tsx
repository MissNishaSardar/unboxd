"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { XCircleIcon } from "lucide-react";
import { withMinDelay } from "@/lib/minDelay";
import { cancelOrder } from "@/server/order-actions";
import {
  CANCEL_REASON_LABELS,
  cancelOrderSchema,
  cancelOrderType,
  cancelReasonSchema,
} from "@/lib/zodSchema";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcnui/alert-dialog";
import { Button } from "@/components/shadcnui/button";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Textarea } from "@/components/shadcnui/textarea";
import { toast } from "@/components/shadcnui/toast";
import { cn } from "@/lib/utils";

const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED"];

const CancelOrderButton = ({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { handleSubmit, control, formState, reset } = useForm<cancelOrderType>({
    resolver: zodResolver(cancelOrderSchema),
    defaultValues: {
      reason: undefined,
      note: "",
    },
    mode: "onSubmit",
  });

  if (!CANCELLABLE_STATUSES.includes(status)) return null;

  const onSubmit = async (values: cancelOrderType) => {
    const result = await withMinDelay(cancelOrder(orderId, values));
    if (result.ok) {
      toast.add({ title: "Order cancelled", type: "success" });
      setOpen(false);
      reset();
      router.push("/orders");
      router.refresh();
    } else if (result.error === "INVALID_TRANSITION") {
      toast.add({
        title: "This order can no longer be cancelled",
        type: "error",
      });
    } else if (result.error === "INVALID_INPUT") {
      toast.add({
        title: "Please choose a reason",
        type: "error",
      });
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}>
      <AlertDialogTrigger
        render={
          <Button
            variant="destructive"
            disabled={formState.isSubmitting}>
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
          undone. Please tell us why you are cancelling.
        </AlertDialogDescription>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4">
          <Controller
            name="reason"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Reason</FieldLabel>
                <div
                  role="radiogroup"
                  aria-label="Cancellation reason"
                  className="flex flex-col gap-1.5">
                  {cancelReasonSchema.options.map((value) => (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors",
                        field.value === value ?
                          "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50",
                      )}>
                      <input
                        type="radio"
                        name={field.name}
                        value={value}
                        checked={field.value === value}
                        onChange={() => field.onChange(value)}
                        onBlur={field.onBlur}
                        disabled={formState.isSubmitting}
                        className="size-4 accent-current"
                      />
                      {CANCEL_REASON_LABELS[value]}
                    </label>
                  ))}
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="note"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${orderId}-cancel-note`}>
                  Note (optional, required for Other)
                </FieldLabel>
                <Textarea
                  {...field}
                  id={`${orderId}-cancel-note`}
                  value={field.value ?? ""}
                  placeholder="Anything else we should know?"
                  rows={3}
                  maxLength={500}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setOpen(false);
                reset();
              }}>
              Keep order
            </AlertDialogCancel>
            <Button
              type="submit"
              variant="destructive"
              disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Cancelling" : "Cancel order"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelOrderButton;
