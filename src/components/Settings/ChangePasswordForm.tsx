"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { changePasswordSchema, changePasswordType } from "@/lib/zodSchema";
import { Button } from "@/components/shadcnui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { toast } from "@/components/shadcnui/toast";

const ChangePasswordForm = () => {
  const { handleSubmit, control, formState, reset } =
    useForm<changePasswordType>({
      resolver: zodResolver(changePasswordSchema),
      defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
      mode: "all",
    });

  const onSubmit = async (values: changePasswordType) => {
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: false,
    });
    if (error) {
      toast.add({
        title: "Password update failed",
        description: error.message ?? "Check your current password.",
        type: "error",
      });
      return;
    }
    toast.add({ title: "Password updated", type: "success" });
    reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate>
      <FieldGroup>
        <Controller
          name="currentPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Current password</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="newPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>New password</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Confirm new password</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button
          type="submit"
          disabled={formState.isSubmitting}>
          {formState.isSubmitting && (
            <Loader2Icon
              data-icon="inline-start"
              className="animate-spin"
            />
          )}
          Update password
        </Button>
      </FieldGroup>
    </form>
  );
};

export default ChangePasswordForm;
