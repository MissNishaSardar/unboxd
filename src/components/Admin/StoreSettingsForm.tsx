"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import useNavigationGuard from "@/hooks/use-navigation-guard";
import { updateStoreSettings } from "@/server/admin/settings";
import { storeSettingsSchema, storeSettingsType } from "@/lib/zodSchema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/shadcnui/alert-dialog";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { Checkbox } from "@/components/shadcnui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/shadcnui/input-group";
import { toast } from "@/components/shadcnui/toast";

const StoreSettingsForm = ({
  initialData,
}: {
  initialData: storeSettingsType;
}) => {
  const [codConfirmOpen, setCodConfirmOpen] = useState(false);
  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: initialData,
    mode: "all",
  });

  const { guard, isOpen, confirmLeave, cancelLeave } =
    useNavigationGuard(isDirty);

  const onSubmit = async (values: storeSettingsType) => {
    const result = await updateStoreSettings(values);
    if (result.ok) {
      reset(values);
      toast.add({ title: "Settings saved", type: "success" });
    } else {
      toast.add({ title: "Could not save settings", type: "error" });
    }
  };

  const onInvalid = () => {
    toast.add({ title: "Fix the highlighted fields", type: "error" });
  };

  const saveBar = (
    <div className="bg-background sticky top-0 z-20 -mx-1 px-1 pt-2 pb-3">
      <div className="border-border bg-card rounded-xl border px-4 py-2 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            role="status"
            aria-live="polite"
            className="text-muted-foreground text-xs">
            {isDirty ? "You have unsaved changes" : "All changes saved"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => guard(() => reset())}
              disabled={isSubmitting || !isDirty}>
              Reset
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !isDirty}>
              {isSubmitting && (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              )}
              Save settings
            </Button>
          </div>
        </div>
        <nav
          aria-label="Settings sections"
          className="border-border mt-2 flex flex-wrap gap-1.5 border-t pt-2">
          <Button
            variant="ghost"
            size="sm"
            render={<a href="#settings-store" />}
            nativeButton={false}>
            Store
          </Button>
          <Button
            variant="ghost"
            size="sm"
            render={<a href="#settings-ordering" />}
            nativeButton={false}>
            Ordering
          </Button>
          <Button
            variant="ghost"
            size="sm"
            render={<a href="#settings-discounts" />}
            nativeButton={false}>
            Discounts
          </Button>
          <Button
            variant="ghost"
            size="sm"
            render={<a href="#settings-inventory" />}
            nativeButton={false}>
            Inventory
          </Button>
        </nav>
      </div>
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate>
      <div className="flex flex-col gap-6 scroll-smooth motion-reduce:scroll-auto">
        {saveBar}
        <Card
          id="settings-store"
          className="scroll-mt-40">
          <CardHeader>
            <CardTitle>Store</CardTitle>
            <CardDescription>
              Name and support contact shown across the storefront.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                name="storeName"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Store name</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      autoComplete="organization"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="supportEmail"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Support email</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      aria-invalid={fieldState.invalid}
                      autoComplete="email"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="supportPhone"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Support phone (optional)
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="tel"
                      aria-invalid={fieldState.invalid}
                      autoComplete="tel"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card
          id="settings-ordering"
          className="scroll-mt-40">
          <CardHeader>
            <CardTitle>Ordering</CardTitle>
            <CardDescription>
              Payment, delivery estimates, and shipping rates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                name="codEnabled"
                control={control}
                render={({ field }) => (
                  <>
                    <Field orientation="horizontal">
                      <Checkbox
                        id={field.name}
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          if (checked === false) {
                            setCodConfirmOpen(true);
                          } else {
                            field.onChange(checked);
                          }
                        }}
                      />
                      <div className="flex flex-col gap-0.5">
                        <FieldLabel htmlFor={field.name}>
                          Cash on delivery enabled
                        </FieldLabel>
                        <FieldDescription>
                          Turning this off pauses checkout with a notice, there
                          is no prepaid method yet.
                        </FieldDescription>
                      </div>
                    </Field>
                    <AlertDialog
                      open={codConfirmOpen}
                      onOpenChange={setCodConfirmOpen}>
                      <AlertDialogContent>
                        <AlertDialogTitle>
                          Disable cash on delivery?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Checkout will pause for all customers until you turn
                          it back on. This takes effect on save.
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep enabled</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => field.onChange(false)}>
                            Turn off
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              />
              <Controller
                name="deliveryDays"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Estimated delivery (days)
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="number"
                      value={field.value as number}
                      min={1}
                      max={30}
                      step={1}
                      inputMode="numeric"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={`${field.name}-hint`}
                    />
                    <FieldDescription id={`${field.name}-hint`}>
                      Whole days from 1 to 30.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="freeShippingThreshold"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Free shipping threshold
                    </FieldLabel>
                    <InputGroup data-invalid={fieldState.invalid}>
                      <InputGroupAddon>
                        <span className="text-muted-foreground text-sm">
                          Rs
                        </span>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        id={field.name}
                        type="number"
                        value={field.value as number}
                        min={0}
                        max={1000000}
                        step={1}
                        inputMode="numeric"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={`${field.name}-hint`}
                      />
                    </InputGroup>
                    <FieldDescription id={`${field.name}-hint`}>
                      Rs amount from 0 to 1000000. Use 0 to always apply the
                      flat rate.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="shippingFlatRate"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Flat shipping rate
                    </FieldLabel>
                    <InputGroup data-invalid={fieldState.invalid}>
                      <InputGroupAddon>
                        <span className="text-muted-foreground text-sm">
                          Rs
                        </span>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        id={field.name}
                        type="number"
                        value={field.value as number}
                        min={0}
                        max={100000}
                        step={1}
                        inputMode="numeric"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={`${field.name}-hint`}
                      />
                    </InputGroup>
                    <FieldDescription id={`${field.name}-hint`}>
                      Rs amount from 0 to 100000.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card
          id="settings-discounts"
          className="scroll-mt-40">
          <CardHeader>
            <CardTitle>Discounts</CardTitle>
            <CardDescription>
              Profit safety limit for per-product discounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                name="maxDiscountPercent"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Maximum discount (%)
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="number"
                      value={field.value as number}
                      min={0}
                      max={90}
                      step={1}
                      inputMode="numeric"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Whole percent from 0 to 90. No product discount can exceed
                      this. Existing products above a lowered cap keep their
                      price until edited.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card
          id="settings-inventory"
          className="scroll-mt-40">
          <CardHeader>
            <CardTitle>Inventory and returns</CardTitle>
            <CardDescription>
              Low-stock alerts and the return window.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                name="lowStockThreshold"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Low-stock threshold (units)
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="number"
                      value={field.value as number}
                      min={2}
                      max={50}
                      step={1}
                      inputMode="numeric"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={`${field.name}-hint`}
                    />
                    <FieldDescription id={`${field.name}-hint`}>
                      Whole units from 2 to 50. Variants below this with stock
                      remaining are flagged low.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="returnWindowDays"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Return window (days)
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="number"
                      value={field.value as number}
                      min={1}
                      max={90}
                      step={1}
                      inputMode="numeric"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={`${field.name}-hint`}
                    />
                    <FieldDescription id={`${field.name}-hint`}>
                      Whole days from 1 to 90.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
      <AlertDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) cancelLeave();
        }}>
        <AlertDialogContent>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            Reset clears every edit on this page. This cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmLeave}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
};

export default StoreSettingsForm;
