"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { signinSchema, signinType } from "@/lib/zodSchema";
import { Button } from "@/components/shadcnui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { toast } from "@/components/shadcnui/toast";

const SignInForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<signinType>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "all",
  });

  const onSubmit = async (values: signinType) => {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    if (error) {
      if (error.status === 403) {
        toast.add({
          title: "Email not verified",
          description: "Please verify your email address before signing in.",
          type: "error",
        });
      } else {
        toast.add({
          title: "Invalid email or password",
          type: "error",
        });
      }
      return;
    }

    router.push(callbackUrl as Route);
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
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
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
        <Button
          type="submit"
          disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2Icon
              data-icon="inline-start"
              className="animate-spin"
            />
          )}
          Sign in
        </Button>
      </FieldGroup>
      <p className="text-muted-foreground mt-4 text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="hover:text-primary underline underline-offset-4">
          Register
        </Link>
      </p>
    </form>
  );
};

export default SignInForm;
