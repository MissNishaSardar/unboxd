"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2Icon, LockIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { withMinDelay } from "@/lib/minDelay";
import { changePasswordSchema, changePasswordType } from "@/lib/zodSchema";
import { Button } from "@/components/shadcnui/button";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/shadcnui/input-group";
import { toast } from "@/components/shadcnui/toast";

const EYEBROW =
  "text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground";

// Security panel for the merged account card. Three password fields in a
// row on desktop, the submit action rides in the section header.
const ChangePasswordForm = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    const { error } = await withMinDelay(
      authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: false,
      }),
    );
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className={`flex items-center gap-2 ${EYEBROW}`}>
          <LockIcon
            className="text-primary size-3.5"
            aria-hidden
          />
          Reset your password
        </span>
        <Button
          type="submit"
          size="sm"
          className="rounded-full px-4"
          disabled={formState.isSubmitting}>
          {formState.isSubmitting && (
            <Loader2Icon
              data-icon="inline-start"
              className="animate-spin"
            />
          )}
          Update password
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Controller
          name="currentPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Current password</FieldLabel>
              <InputGroup data-invalid={fieldState.invalid}>
                <InputGroupInput
                  {...field}
                  id={field.name}
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label={
                      showCurrentPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showCurrentPassword}
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    size="icon-xs">
                    {showCurrentPassword ?
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
          name="newPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>New password</FieldLabel>
              <InputGroup data-invalid={fieldState.invalid}>
                <InputGroupInput
                  {...field}
                  id={field.name}
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showNewPassword}
                    onClick={() => setShowNewPassword((v) => !v)}
                    size="icon-xs">
                    {showNewPassword ?
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
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Confirm new password</FieldLabel>
              <InputGroup data-invalid={fieldState.invalid}>
                <InputGroupInput
                  {...field}
                  id={field.name}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat the new password"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    size="icon-xs">
                    {showConfirmPassword ?
                      <EyeOffIcon aria-hidden="true" />
                    : <EyeIcon aria-hidden="true" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </form>
  );
};

export default ChangePasswordForm;
