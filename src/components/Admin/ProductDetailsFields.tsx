"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import CategoryForm from "@/components/Admin/CategoryForm";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/shadcnui/alert-dialog";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { Button } from "@/components/shadcnui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { Textarea } from "@/components/shadcnui/textarea";
import {
  type productFormInputType,
  type productFormType,
} from "@/lib/zodSchema";
import {
  effectivePrice,
  activeDiscountPercent,
  dealStatus,
} from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import {
  formatISTRange,
  fromDateTimeLocalIST,
  toDateTimeLocalIST,
} from "@/lib/deals";

const toScheduleDate = (value: unknown): Date | undefined => {
  if (value instanceof Date) return value;
  if (typeof value === "string") return fromDateTimeLocalIST(value);
  return undefined;
};

const ProductDetailsFields = ({
  categories,
  onCategoryCreated,
}: {
  categories: { id: string; name: string }[];
  onCategoryCreated?: (cat: { id: string; name: string }) => void;
}) => {
  const [createOpen, setCreateOpen] = useState(false);
  const { control, watch, setValue } = useFormContext<
    productFormInputType,
    undefined,
    productFormType
  >();
  const basePriceValue = watch("basePrice");
  const discountValue = watch("discountPercent");
  const scheduleStartRaw = watch("discountStartsAt");
  const scheduleEndRaw = watch("discountEndsAt");
  const scheduleStart = toScheduleDate(scheduleStartRaw);
  const scheduleEnd = toScheduleDate(scheduleEndRaw);
  const schedulePercent = Number(discountValue) || 0;
  const scheduleWindow = {
    discountPercent: schedulePercent,
    discountStartsAt: scheduleStart,
    discountEndsAt: scheduleEnd,
  };
  const scheduleState = dealStatus(scheduleWindow);
  const schedulePrice = formatPrice(
    effectivePrice(
      Number(basePriceValue) || 0,
      0,
      activeDiscountPercent(scheduleWindow),
    ),
  );
  const scheduleRange = formatISTRange(scheduleStart, scheduleEnd);
  const scheduleSummary =
    schedulePercent <= 0 ?
      "Set a discount above 0 to schedule a deal. Times are IST."
    : scheduleState === "live" ?
      `Deal is live${scheduleRange ? `, ${scheduleRange}` : ""}. Base configuration sells for ${schedulePrice}.`
    : scheduleState === "scheduled" ?
      `Deal is scheduled${scheduleRange ? ` for ${scheduleRange}` : ""}. Base configuration will sell for ${schedulePrice}.`
    : `Deal is over${scheduleRange ? `, ${scheduleRange}` : ""}. Shoppers see full price.`;

  const handleEndNow = () => {
    setValue("discountEndsAt", toDateTimeLocalIST(new Date()), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleClearSchedule = () => {
    setValue("discountStartsAt", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("discountEndsAt", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Basic information shown on the product page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="basePrice"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Base price (₹)</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    step="0.01"
                    min="0"
                    value={field.value as number}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="discountPercent"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Discount (%, applies to all variants)
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    step="1"
                    min="0"
                    max="90"
                    value={field.value as number}
                    aria-invalid={fieldState.invalid}
                  />
                  <p className="text-muted-foreground text-xs">
                    Base configuration sells for{" "}
                    {formatPrice(
                      effectivePrice(
                        Number(basePriceValue) || 0,
                        0,
                        Number(discountValue) || 0,
                      ),
                    )}
                    . Store cap applies on save.
                  </p>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="flex flex-col gap-3 rounded-xl border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Controller
                  name="discountStartsAt"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Deal starts (IST)
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type="datetime-local"
                        value={(field.value as string) ?? ""}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="discountEndsAt"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Deal ends (IST)
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type="datetime-local"
                        value={(field.value as string) ?? ""}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEndNow}>
                  End now
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSchedule}>
                  Clear schedule
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">{scheduleSummary}</p>
            </div>

            <Controller
              name="brand"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Brand</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Apple, Samsung, Sony..."
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="categoryId"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Category</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))}>
                    <SelectTrigger
                      id={field.name}
                      aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                      <SelectSeparator />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setCreateOpen(true)}
                        className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm">
                        <PlusIcon
                          className="size-4"
                          aria-hidden="true"
                        />
                        Create category
                      </button>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="flex flex-wrap gap-6">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Field>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={field.name}
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                      <FieldLabel htmlFor={field.name}>Active</FieldLabel>
                    </div>
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <AlertDialog
        open={createOpen}
        onOpenChange={setCreateOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogTitle>Create category</AlertDialogTitle>
          <AlertDialogDescription>
            Add a new category to the catalog. It will be auto-selected.
          </AlertDialogDescription>
          <CategoryForm
            mode="create"
            categories={categories}
            hideCardWrapper
            onCreated={(newCat) => {
              onCategoryCreated?.(newCat);
              setCreateOpen(false);
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductDetailsFields;
