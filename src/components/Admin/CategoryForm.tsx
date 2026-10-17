"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { createCategory, updateCategory } from "@/server/admin/categories";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import {
  Field,
  FieldDescription,
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
import { toast } from "@/components/shadcnui/toast";
import {
  categoryFormSchema,
  type categoryFormInputType,
  type categoryFormType,
} from "@/lib/zodSchema";

const CategoryForm = ({
  mode,
  categoryId,
  initialData,
  categories,
  excludeIds,
  onCreated,
  onCancel,
  hideCardWrapper = false,
}: {
  mode: "create" | "edit";
  categoryId?: string;
  initialData?: { name: string; parentId: string | null; position?: number };
  categories: { id: string; name: string }[];
  excludeIds?: string[];
  onCreated?: (cat: { id: string; name: string }) => void;
  onCancel?: () => void;
  hideCardWrapper?: boolean;
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<categoryFormInputType, undefined, categoryFormType>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      parentId: initialData?.parentId ?? "",
      position: initialData?.position ?? 0,
    },
    mode: "all",
  });

  const parentOptions = categories.filter(
    (category) => !excludeIds?.includes(category.id),
  );

  const onSubmit = async (data: categoryFormType) => {
    setIsSubmitting(true);
    const result =
      mode === "create" ?
        await createCategory(data)
      : await updateCategory(categoryId!, data);
    setIsSubmitting(false);

    if (result.ok) {
      toast.add({
        title: mode === "create" ? "Category created" : "Category updated",
        type: "success",
      });
      if (mode === "create") {
        reset();
      } else {
        reset(data);
      }
      if (onCreated && mode === "create") {
        onCreated({ id: result.id, name: data.name.trim() });
      } else {
        router.replace("/admin/categories");
      }
    } else if (result.error === "INVALID_INPUT") {
      toast.add({ title: "Invalid category details", type: "error" });
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const formContent = (
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="parentId"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Parent category</FieldLabel>
            <Select
              value={field.value ?? ""}
              onValueChange={(value) => field.onChange(value ?? "")}
              items={parentOptions.map((category) => ({
                value: category.id,
                label: category.name,
              }))}>
              <SelectTrigger id={field.name}>
                <SelectValue placeholder="No parent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No parent</SelectItem>
                {parentOptions.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Leave as No parent to create a top-level category.
            </FieldDescription>
          </Field>
        )}
      />

      {mode === "edit" && (
        <Controller
          name="position"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Position</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="number"
                step="1"
                min="0"
                max="9999"
                value={field.value as number}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                Lower shows first. Ties fall back to name order.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}
    </FieldGroup>
  );

  const formActions = (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          if (onCancel) onCancel();
          else router.back();
        }}>
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting || !isDirty || Object.keys(errors).length > 0}>
        {mode === "create" ? "Create category" : "Save changes"}
      </Button>
    </>
  );

  if (hideCardWrapper) {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4">
        {formContent}
        <div className="flex justify-end gap-2">{formActions}</div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate>
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "New category" : "Edit category"}
          </CardTitle>
          <CardDescription>
            Leave the parent empty to create a top-level category, or nest it
            under an existing one.
          </CardDescription>
        </CardHeader>
        <CardContent>{formContent}</CardContent>
        <CardFooter className="justify-end gap-2">{formActions}</CardFooter>
      </Card>
    </form>
  );
};

export default CategoryForm;
