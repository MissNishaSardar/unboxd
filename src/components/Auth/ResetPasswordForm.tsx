"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { resetPasswordSchema, resetPasswordType } from "@/lib/zodSchema";
import { Button } from "@/components/shadcnui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { toast } from "@/components/shadcnui/toast";

type ResetPasswordFormProps = {
  token: string;
};

const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const router = useRouter();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, isDirty },
  } = useForm<resetPasswordType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "all",
  });

  const onSubmit = async (values: resetPasswordType) => {
    const { error } = await authClient.resetPassword({
      newPassword: values.newPassword,
      token,
    });

    if (error) {
      toast.add({
        title: "Reset failed",
        description: error.message,
        type: "error",
      });
      return;
    }

    toast.add({
      title: "Password updated",
      description: "You can now sign in with your new password.",
      type: "success",
    });
    router.push("/auth/login");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate>
      <FieldGroup>
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
              <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
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
          disabled={isSubmitting || !isDirty}>
          {isSubmitting && (
            <Loader2Icon
              data-icon="inline-start"
              className="animate-spin"
            />
          )}
          Reset password
        </Button>
      </FieldGroup>
    </form>
  );
};

export default ResetPasswordForm;
