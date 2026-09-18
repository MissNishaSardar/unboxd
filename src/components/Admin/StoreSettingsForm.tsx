"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { Textarea } from "@/components/shadcnui/textarea";
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
    watch,
    formState: { isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: initialData,
    mode: "all",
  });

  const announcementText = watch("announcementText");
  const announcementEnabled = watch("announcementEnabled");

  const onSubmit = async (values: storeSettingsType) => {
    const result = await updateStoreSettings(values);
    if (result.ok) {
      reset(values);
      toast.add({ title: "Settings saved", type: "success" });
    } else {
      toast.add({ title: "Could not save settings", type: "error" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate>
      <div className="flex flex-col gap-6">
        <Card>
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

        <Card>
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
                      aria-invalid={fieldState.invalid}
                    />
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
                        aria-invalid={fieldState.invalid}
                      />
                    </InputGroup>
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
                        aria-invalid={fieldState.invalid}
                      />
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
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
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      No product discount can exceed this. Existing products
                      above a lowered cap keep their price until edited.
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

        <Card>
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
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Variants below this with stock remaining are flagged low.
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
                      aria-invalid={fieldState.invalid}
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

        <Card>
          <CardHeader>
            <CardTitle>Announcement</CardTitle>
            <CardDescription>
              Banner shown across the storefront when enabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                name="announcementEnabled"
                control={control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Checkbox
                      id={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel
                      htmlFor={field.name}
                      className="font-normal">
                      Show announcement banner
                    </FieldLabel>
                  </Field>
                )}
              />
              <Controller
                name="announcementText"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Announcement text
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      rows={2}
                      maxLength={140}
                      aria-invalid={fieldState.invalid}
                    />
                    {announcementEnabled && announcementText.trim() !== "" && (
                      <p
                        aria-label="Announcement preview"
                        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-center text-xs font-medium">
                        {announcementText}
                      </p>
                    )}
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
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
    </form>
  );
};

export default StoreSettingsForm;
