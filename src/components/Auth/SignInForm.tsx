"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { withMinDelay } from "@/lib/minDelay";
import { signinSchema, signinType } from "@/lib/zodSchema";
import { Button } from "@/components/shadcnui/button";
import { Checkbox } from "@/components/shadcnui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/shadcnui/input-group";
import { toast } from "@/components/shadcnui/toast";

const SignInForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallbackUrl?.startsWith("/") && !rawCallbackUrl.startsWith("//") ?
      rawCallbackUrl
    : "/";
  const [showPassword, setShowPassword] = useState(false);

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<signinType>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "all",
  });

  const onSubmit = async (values: signinType) => {
    const { data, error } = await withMinDelay(
      authClient.signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe ?? true,
      }),
    );

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

    const fallback = data?.user.role === "admin" ? "/admin" : "/";
    const target = callbackUrl && callbackUrl !== "/" ? callbackUrl : fallback;
    reset();
    router.push(target as Route);
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
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Link
                  href="/auth/forgot-password"
                  className="hover:text-primary text-sm underline underline-offset-4">
                  Forgot password?
                </Link>
              </div>
              <InputGroup data-invalid={fieldState.invalid}>
                <InputGroupInput
                  {...field}
                  id={field.name}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((v) => !v)}
                    size="icon-xs">
                    {showPassword ?
                      <EyeOffIcon aria-hidden="true" />
                    : <EyeIcon aria-hidden="true" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <FieldLabel
                htmlFor={field.name}
                className="font-normal">
                Remember me
              </FieldLabel>
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
