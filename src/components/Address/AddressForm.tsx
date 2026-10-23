"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/shadcnui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/shadcnui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { INDIAN_STATES } from "@/lib/indianStates";
import {
  userAddressInputType,
  userAddressSchema,
  userAddressType,
} from "@/lib/zodSchema";

const LABELS = ["Home", "Work"] as const;

type AddressFormProps = {
  defaultValues?: Partial<userAddressType>;
  submitLabel: string;
  submitId?: string;
  disabled?: boolean;
  onSubmit: (values: userAddressType) => Promise<void>;
  onCancel?: () => void;
};

const AddressForm = ({
  defaultValues,
  submitLabel,
  submitId,
  disabled,
  onSubmit,
  onCancel,
}: AddressFormProps) => {
  const { handleSubmit, control, formState, watch } = useForm<
    userAddressInputType,
    undefined,
    userAddressType
  >({
    resolver: zodResolver(userAddressSchema),
    defaultValues: {
      label: "",
      name: "",
      phone: "",
      addressLine: "",
      city: "",
      state: "",
      pincode: "",
      ...defaultValues,
    },
    mode: "all",
  });
  const { isSubmitting, submitCount, isValid } = formState;
  const values = watch();
  const labelValue = values.label ?? "";
  // Covers parents with an async follow-up after validation passes, such as
  // the checkout order request, so the form stays locked until it settles.
  const busy = isSubmitting || disabled;
  // Semantic check instead of raw isDirty. The schema trims every field, so
  // a whitespace only edit must not enable Save.
  const base = {
    label: defaultValues?.label ?? "",
    name: defaultValues?.name ?? "",
    phone: defaultValues?.phone ?? "",
    addressLine: defaultValues?.addressLine ?? "",
    city: defaultValues?.city ?? "",
    state: defaultValues?.state ?? "",
    pincode: defaultValues?.pincode ?? "",
  };
  const hasChanges =
    (values.label ?? "").trim() !== base.label ||
    (values.name ?? "").trim() !== base.name ||
    values.phone !== base.phone ||
    (values.addressLine ?? "").trim() !== base.addressLine ||
    (values.city ?? "").trim() !== base.city ||
    values.state !== base.state ||
    values.pincode !== base.pincode;

  const submit = async (values: userAddressType) => {
    await onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-4">
      <FieldGroup>
        <Controller
          name="label"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Label (optional)</FieldLabel>
              <div className="flex gap-2">
                {LABELS.map((label) => (
                  <Button
                    key={label}
                    type="button"
                    variant={labelValue === label ? "default" : "outline"}
                    size="sm"
                    aria-pressed={labelValue === label}
                    onClick={() =>
                      field.onChange(labelValue === label ? "" : label)
                    }>
                    {label}
                  </Button>
                ))}
              </div>
              <FieldDescription>
                Tap again to clear. Used to tell saved addresses apart.
              </FieldDescription>
            </Field>
          )}
        />
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Full name</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Jane Doe"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="phone"
          control={control}
          render={({
            field: { value, onChange, onBlur, name, ref },
            fieldState,
          }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={name}>Phone</FieldLabel>
              <InputGroup>
                <InputGroupAddon aria-hidden="true">+91</InputGroupAddon>
                <InputGroupInput
                  id={name}
                  name={name}
                  ref={ref}
                  onBlur={onBlur}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98765 43210"
                  autoComplete="tel"
                  aria-invalid={fieldState.invalid}
                  value={(value as string) ?? ""}
                  onChange={(e) =>
                    onChange(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="addressLine"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Address</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="House no, street, area"
                autoComplete="street-address"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            name="city"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>City</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Bengaluru"
                  autoComplete="address-level2"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="state"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>State</FieldLabel>
                <Select
                  value={field.value || ""}
                  items={INDIAN_STATES.map((state) => ({
                    value: state,
                    label: state,
                  }))}
                  onValueChange={field.onChange}>
                  <SelectTrigger
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    className="w-full">
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem
                        key={state}
                        value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <Controller
          name="pincode"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Pincode</FieldLabel>
              <Input
                {...field}
                id={field.name}
                inputMode="numeric"
                maxLength={6}
                placeholder="560001"
                autoComplete="postal-code"
                aria-invalid={fieldState.invalid}
                onChange={(e) =>
                  field.onChange(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      {submitCount > 0 && !isValid && (
        <p
          role="alert"
          className="text-destructive text-xs">
          Fill all fields to continue.
        </p>
      )}
      <div className="flex gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={busy}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          id={submitId}
          disabled={busy || !hasChanges}
          data-icon={busy ? "inline-start" : undefined}
          className="flex-1">
          {busy && (
            <Loader2Icon
              aria-hidden="true"
              className="animate-spin"
            />
          )}
          {disabled && !isSubmitting ? "Placing order" : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
