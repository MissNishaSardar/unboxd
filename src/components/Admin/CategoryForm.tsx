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
import { categoryFormSchema, type categoryFormType } from "@/lib/zodSchema";

const CategoryForm = ({
  mode,
  categoryId,
  initialData,
  categories,
  excludeIds,
}: {
  mode: "create" | "edit";
  categoryId?: string;
  initialData?: { name: string; parentId: string | null };
  categories: { id: string; name: string }[];
  excludeIds?: string[];
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<categoryFormType>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      parentId: initialData?.parentId ?? "",
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
      router.replace("/admin/categories");
    } else if (result.error === "INVALID_INPUT") {
      toast.add({ title: "Invalid category details", type: "error" });
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

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
            Categories can be nested under a parent category.
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
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting || !isDirty || Object.keys(errors).length > 0
            }>
            {mode === "create" ? "Create category" : "Save changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default CategoryForm;
