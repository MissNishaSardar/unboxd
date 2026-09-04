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

const ProductDetailsFields = ({
  categories,
  onCategoryCreated,
}: {
  categories: { id: string; name: string }[];
  onCategoryCreated?: (cat: { id: string; name: string }) => void;
}) => {
  const [createOpen, setCreateOpen] = useState(false);
  const { control } = useFormContext<
    productFormInputType,
    undefined,
    productFormType
  >();

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
