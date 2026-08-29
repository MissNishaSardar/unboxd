"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema, forgotPasswordType } from "@/lib/zodSchema";
import { Button } from "@/components/shadcnui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { toast } from "@/components/shadcnui/toast";

const ForgotPasswordForm = () => {
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, isDirty },
  } = useForm<forgotPasswordType>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "all",
  });

  const onSubmit = async (values: forgotPasswordType) => {
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/auth/reset-password",
    });

    if (error) {
      toast.add({
        title: "Unable to send reset email",
        description: error.message,
        type: "error",
      });
      return;
    }

    toast.add({
      title: "Check your email",
      description:
        "If an account exists for that email, you will receive a reset link. In development, check the server console for the URL.",
      type: "success",
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate>
      <FieldGroup>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
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
          Send reset link
        </Button>
      </FieldGroup>
      <p className="text-muted-foreground mt-4 text-sm">
        Remember your password?{" "}
        <Link
          href="/auth/login"
          className="hover:text-primary underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
};

export default ForgotPasswordForm;
