"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { profileUpdateSchema, profileUpdateType } from "@/lib/zodSchema";
import { Button } from "@/components/shadcnui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { toast } from "@/components/shadcnui/toast";

type ProfileFormProps = {
  defaultName: string;
};

const ProfileForm = ({ defaultName }: ProfileFormProps) => {
  const router = useRouter();

  const { handleSubmit, control, formState, reset } =
    useForm<profileUpdateType>({
      resolver: zodResolver(profileUpdateSchema),
      defaultValues: { name: defaultName },
      mode: "all",
    });

  const onSubmit = async (values: profileUpdateType) => {
    const { error } = await authClient.updateUser({
      name: values.name,
    });

    if (error) {
      toast.add({
        title: "Update failed",
        description: error.message ?? "Could not update profile.",
        type: "error",
      });
      return;
    }

    toast.add({
      title: "Profile updated",
      type: "success",
    });
    reset(values);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate>
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
                type="text"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button
          type="submit"
          disabled={formState.isSubmitting || !formState.isDirty}>
          {formState.isSubmitting && (
            <Loader2Icon
              data-icon="inline-start"
              className="animate-spin"
            />
          )}
          Save changes
        </Button>
      </FieldGroup>
    </form>
  );
};

export default ProfileForm;
