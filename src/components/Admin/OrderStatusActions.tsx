"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ArrowRightIcon, RotateCcwIcon, XCircleIcon } from "lucide-react";
import { withMinDelay } from "@/lib/minDelay";
import { updateOrderStatus } from "@/server/admin/order-actions";
import {
  ADMIN_CANCEL_REASON_LABELS,
  adminCancelOrderSchema,
  adminCancelOrderType,
  adminCancelReasonSchema,
} from "@/lib/zodSchema";
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
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Textarea } from "@/components/shadcnui/textarea";
import { toast } from "@/components/shadcnui/toast";
import { cn } from "@/lib/utils";
import {
  canTransition,
  getNextStatus,
  getOrderStatusConfig,
} from "@/lib/orders/status";

const OrderStatusActions = ({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const cancelForm = useForm<adminCancelOrderType>({
    resolver: zodResolver(adminCancelOrderSchema),
    defaultValues: { reason: undefined, note: "" },
    mode: "onSubmit",
  });

  const handleUpdate = async (nextStatus: string) => {
    setIsPending(true);
    const result = await withMinDelay(
      updateOrderStatus(orderId, { status: nextStatus }),
    );
    setIsPending(false);
    if (result.ok) {
      toast.add({
        title: `Order marked ${getOrderStatusConfig(result.status).label.toLowerCase()}`,
        type: "success",
      });
      router.refresh();
    } else if (result.error === "INVALID_TRANSITION") {
      toast.add({ title: "Invalid status transition", type: "error" });
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const nextStatus = getNextStatus(status);
  const canCancel = canTransition(status, "CANCELLED");
  const canReturn = canTransition(status, "RETURNED");

  const handleCancel = async (values: adminCancelOrderType) => {
    setIsPending(true);
    const result = await withMinDelay(
      updateOrderStatus(orderId, {
        status: "CANCELLED",
        ...values,
      }),
    );
    setIsPending(false);
    if (result.ok) {
      toast.add({ title: "Order cancelled", type: "success" });
      setCancelOpen(false);
      cancelForm.reset();
      router.push("/admin/orders");
      router.refresh();
    } else if (result.error === "INVALID_INPUT") {
      toast.add({ title: "Please choose a reason", type: "error" });
    } else if (result.error === "INVALID_TRANSITION") {
      toast.add({ title: "Invalid status transition", type: "error" });
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  if (!nextStatus && !canCancel && !canReturn) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nextStatus && (
        <Button
          onClick={() => handleUpdate(nextStatus)}
          disabled={isPending}>
          <ArrowRightIcon
            data-icon="inline-start"
            aria-hidden="true"
          />
          Mark as {getOrderStatusConfig(nextStatus).label.toLowerCase()}
        </Button>
      )}
      {canReturn && (
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
                Mark returned
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogTitle>Mark order as returned?</AlertDialogTitle>
            <AlertDialogDescription>
              Stock will be restored for the returned items.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep order</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => handleUpdate("RETURNED")}>
                Mark returned
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {canCancel && (
        <AlertDialog
          open={cancelOpen}
          onOpenChange={(next) => {
            setCancelOpen(next);
            if (!next) cancelForm.reset();
          }}>
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
              Stock will be restored for the cancelled items. Choose a reason
              for the records.
            </AlertDialogDescription>
            <form
              onSubmit={cancelForm.handleSubmit(handleCancel)}
              noValidate
              className="flex flex-col gap-4">
              <Controller
                name="reason"
                control={cancelForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Reason</FieldLabel>
                    <div
                      role="radiogroup"
                      aria-label="Cancellation reason"
                      className="flex flex-col gap-1.5">
                      {adminCancelReasonSchema.options.map((value) => (
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
                            disabled={isPending}
                            className="size-4 accent-current"
                          />
                          {ADMIN_CANCEL_REASON_LABELS[value]}
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
                control={cancelForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${orderId}-admin-cancel-note`}>
                      Note (optional, required for Other)
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id={`${orderId}-admin-cancel-note`}
                      value={field.value ?? ""}
                      placeholder="Anything else for the records?"
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
                    setCancelOpen(false);
                    cancelForm.reset();
                  }}>
                  Keep order
                </AlertDialogCancel>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isPending}>
                  {isPending ? "Cancelling" : "Cancel order"}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default OrderStatusActions;
