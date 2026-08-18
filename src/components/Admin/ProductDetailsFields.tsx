"use client";

import { ArrowRightIcon } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { Textarea } from "@/components/shadcnui/textarea";
import {
  type productFormInputType,
  type productFormType,
} from "@/lib/zodSchema";

const ProductDetailsFields = ({
  categories,
  onNext,
}: {
  categories: { id: string; name: string }[];
  onNext?: () => void;
}) => {
  const { control } = useFormContext<
    productFormInputType,
    undefined,
    productFormType
  >();

  return (
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
      {onNext && (
        <CardFooter className="justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onNext}
            aria-label="Next: Variants">
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ProductDetailsFields;
