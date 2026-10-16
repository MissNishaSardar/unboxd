"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, TriangleAlertIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
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
import { Textarea } from "@/components/shadcnui/textarea";
import { toast } from "@/components/shadcnui/toast";
import { dealStatus } from "@/lib/pricing";
import {
  formatISTRange,
  fromDateTimeLocalIST,
  saleWindowsOverlap,
  toDateTimeLocalIST,
} from "@/lib/deals";
import { flashSaleSchema, type flashSaleType } from "@/lib/zodSchema";
import { type FlashSaleData } from "@/server/deals";
import { createSale, updateSale } from "@/server/deals";

type FlashSaleInput = z.input<typeof flashSaleSchema>;

const toISTDate = (value: unknown): Date | undefined => {
  if (value instanceof Date) return value;
  if (typeof value === "string") return fromDateTimeLocalIST(value);
  return undefined;
};

const DealForm = ({
  mode,
  saleId,
  initialData,
  maxDiscountPercent,
  otherSales = [],
}: {
  mode: "create" | "edit";
  saleId?: string;
  initialData?: FlashSaleData;
  maxDiscountPercent: number;
  otherSales?: FlashSaleData[];
}) => {
  const router = useRouter();
  const {
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { isSubmitting, isDirty },
  } = useForm<FlashSaleInput, undefined, flashSaleType>({
    resolver: zodResolver(flashSaleSchema),
    mode: "all",
    defaultValues:
      initialData ?
        {
          name: initialData.name,
          discountPercent: initialData.discountPercent,
          startsAt: toDateTimeLocalIST(initialData.startsAt),
          endsAt: toDateTimeLocalIST(initialData.endsAt),
          bannerText: initialData.bannerText,
          bannerEnabled: initialData.bannerEnabled,
          isActive: initialData.isActive,
        }
      : {
          name: "",
          discountPercent: 10,
          startsAt: "",
          endsAt: "",
          bannerText: "",
          bannerEnabled: true,
          isActive: true,
        },
  });

  const discountValue = watch("discountPercent");
  const startRaw = watch("startsAt");
  const endRaw = watch("endsAt");
  const bannerOn = watch("bannerEnabled");
  const saleEnabled = watch("isActive");
  const percent = Number(discountValue) || 0;
  const start = toISTDate(startRaw);
  const end = toISTDate(endRaw);
  const state = dealStatus({
    discountPercent: percent,
    discountStartsAt: start,
    discountEndsAt: end,
  });
  const range = formatISTRange(start, end);
  const clashes = (saleEnabled && percent > 0 ? otherSales : []).filter(
    (other) =>
      other.isActive &&
      other.discountPercent > 0 &&
      saleWindowsOverlap({ startsAt: start, endsAt: end }, other),
  );
  const clash = clashes[0] ?? null;
  const clashRange = clash ? formatISTRange(clash.startsAt, clash.endsAt) : "";
  const clashText =
    !clash ? null
    : clashes.length > 1 ?
      `Overlaps ${clash.name} and ${clashes.length - 1} other${clashes.length - 1 === 1 ? "" : "s"}${clashRange ? ` (${clashRange})` : ""}. Save is blocked while two discount sales cover the same window.`
    : `Overlaps ${clash.name}${clashRange ? ` (${clashRange})` : ""}. Save is blocked while two discount sales cover the same window.`;
  const summary =
    percent <= 0 ? `Info banner only, no price cut${range ? `, ${range}` : ""}.`
    : state === "live" ?
      `Sale is live${range ? `, ${range}` : ""}. Every product takes the greater of its own deal and ${percent}%.`
    : state === "scheduled" ?
      `Sale is scheduled${range ? ` for ${range}` : ""}. Prices change on their own at start.`
    : `Sale is over${range ? `, ${range}` : ""}. Shoppers see normal prices.`;

  const onSubmit = async (values: flashSaleType) => {
    if (values.discountPercent > maxDiscountPercent) {
      setError("discountPercent", {
        message: `Discount must be at most ${maxDiscountPercent}`,
      });
      toast.add({
        title: `Discount exceeds store cap of ${maxDiscountPercent}%`,
        type: "error",
      });
      return;
    }
    const payload = {
      ...values,
      startsAt: toISTDate(values.startsAt),
      endsAt: toISTDate(values.endsAt),
    };
    const result =
      mode === "create" ? await createSale(payload)
      : !saleId ? { ok: false as const, error: "NOT_FOUND" as const }
      : await updateSale(saleId, payload);
    if (result.ok) {
      toast.add({
        title: mode === "create" ? "Sale created" : "Sale updated",
        type: "success",
      });
      router.replace("/admin/deals" as Route);
      return;
    }
    toast.add({
      title:
        result.error === "OVERLAP" ? "Another discount sale covers that window"
        : result.error === "FORBIDDEN" ?
          "You do not have permission to manage sales"
        : "Please check the form for errors",
      type: "error",
    });
  };

  const handleEndNow = () => {
    setValue("endsAt", toDateTimeLocalIST(new Date()), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleClearSchedule = () => {
    setValue("startsAt", "", { shouldDirty: true, shouldValidate: true });
    setValue("endsAt", "", { shouldDirty: true, shouldValidate: true });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Sale</CardTitle>
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
                    placeholder="Diwali offer"
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
                    Discount (%, whole store, 0 for info only)
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    step="1"
                    min="0"
                    max={maxDiscountPercent}
                    value={field.value as number}
                    aria-invalid={fieldState.invalid}
                  />
                  <p className="text-muted-foreground text-xs">
                    Cap is {maxDiscountPercent}%. The greater of this sale and
                    each product deal wins, they never add up.
                  </p>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Controller
                name="startsAt"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Starts (IST)</FieldLabel>
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
                name="endsAt"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Ends (IST)</FieldLabel>
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
              {mode === "edit" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEndNow}>
                  End now
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSchedule}>
                Clear schedule
              </Button>
            </div>
            {clashText && (
              <div
                role="alert"
                className="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-xs">
                <TriangleAlertIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <p>{clashText}</p>
              </div>
            )}
            <p className="text-muted-foreground text-xs">{summary}</p>
            <Controller
              name="bannerText"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Banner text</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    rows={2}
                    maxLength={140}
                    placeholder="Diwali offer, 10% off everything"
                    aria-invalid={fieldState.invalid}
                  />
                  {bannerOn && (field.value as string)?.trim() !== "" && (
                    <p className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-center text-xs font-medium">
                      {field.value as string}
                    </p>
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="bannerEnabled"
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
                    Show banner while live
                  </FieldLabel>
                </Field>
              )}
            />
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id={field.name}
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  <FieldLabel
                    htmlFor={field.name}
                    className="font-normal">
                    Sale enabled
                  </FieldLabel>
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || (mode === "edit" && !isDirty)}>
          {isSubmitting && (
            <Loader2Icon
              data-icon="inline-start"
              className="animate-spin"
              aria-hidden="true"
            />
          )}
          {mode === "create" ? "Create sale" : "Save changes"}
        </Button>
      </div>
    </form>
  );
};

export default DealForm;
