"use client";

import { PlusIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  type productFormInputType,
  type productFormType,
} from "@/lib/zodSchema";

const ProductVariantsFields = () => {
  const { control } = useFormContext<
    productFormInputType,
    undefined,
    productFormType
  >();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variants</CardTitle>
        <CardDescription>
          Each variant is a purchasable option with its own SKU, price
          difference, and stock.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          {fields.map((variant, index) => (
            <FieldGroup key={variant.id}>
              <div className="grid gap-2 sm:grid-cols-[1fr_8rem_2.5rem] sm:items-end">
                <Controller
                  name={`variants.${index}.name`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Variant name</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="8GB / 256GB / Black"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name={`variants.${index}.stock`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Stock</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type="number"
                        min="0"
                        value={field.value as number}
                        aria-invalid={fieldState.invalid}
                      />
                      {!fieldState.invalid && Number(field.value) === 0 && (
                        <p
                          className="flex items-center gap-1 text-xs text-amber-600"
                          role="status">
                          <TriangleAlertIcon
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          This variant will be listed as Out of stock
                        </p>
                      )}
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                  aria-label="Remove variant">
                  <Trash2Icon aria-hidden="true" />
                </Button>
              </div>
            </FieldGroup>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: "", stock: 0 })}>
            <PlusIcon
              data-icon="inline-start"
              aria-hidden="true"
            />
            Add variant
          </Button>
        </FieldSet>
      </CardContent>
    </Card>
  );
};

export default ProductVariantsFields;
