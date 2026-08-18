"use client";

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
  FieldSet,
} from "@/components/shadcnui/field";
import ImageUploader from "@/components/Upload/ImageUploader";
import {
  type productFormInputType,
  type productFormType,
} from "@/lib/zodSchema";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

const ProductImagesFields = () => {
  const { control } = useFormContext<
    productFormInputType,
    undefined,
    productFormType
  >();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "images",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Images</CardTitle>
        <CardDescription>
          The first image is used as the product thumbnail. Reorder with the
          arrows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          {fields.map((image, index) => (
            <FieldGroup key={image.id}>
              <div className="flex items-start gap-4">
                <Controller
                  name={`images.${index}.url`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <ImageUploader
                        value={field.value || null}
                        onChange={(url) => field.onChange(url ?? "")}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <div className="flex flex-1 gap-2">
                  {/* <Controller
                    name={`images.${index}.alt`}
                    control={control}
                    render={({ field }) => (
                      <Field className="flex-2">
                        <FieldLabel htmlFor={field.name}>Alt text</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          placeholder="Describe the image"
                        />
                      </Field>
                    )}
                  /> */}
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => move(index, index - 1)}
                      disabled={index === 0}
                      aria-label="Move image up">
                      <ArrowUpIcon aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => move(index, index + 1)}
                      disabled={index === fields.length - 1}
                      aria-label="Move image down">
                      <ArrowDownIcon aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                      aria-label="Remove image">
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            </FieldGroup>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ url: "", alt: "", sortOrder: fields.length })
            }>
            <PlusIcon
              data-icon="inline-start"
              aria-hidden="true"
            />
            Add image
          </Button>
        </FieldSet>
      </CardContent>
    </Card>
  );
};

export default ProductImagesFields;
