"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { profileUpdateSchema, profileUpdateType } from "@/lib/zodSchema";
import { deleteAvatarFile } from "@/server/user/uploadAvatar";
import AvatarUploader from "@/components/Settings/AvatarUploader";
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
  defaultImage: string | null;
  redirectTo?: string;
};

const ProfileForm = ({
  defaultName,
  defaultImage,
  redirectTo = "/settings",
}: ProfileFormProps) => {
  const router = useRouter();

  const { handleSubmit, control, formState, reset } =
    useForm<profileUpdateType>({
      resolver: zodResolver(profileUpdateSchema),
      defaultValues: {
        name: defaultName,
        image: defaultImage ?? null,
      },
      mode: "all",
    });

  const onSubmit = async (values: profileUpdateType) => {
    const prevImage = defaultImage;
    const nextImage = values.image ?? null;
    const { error } = await authClient.updateUser({
      name: values.name,
      image: (nextImage ?? null) as string | null,
    } as unknown as Parameters<typeof authClient.updateUser>[0]);

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
    if (
      prevImage &&
      prevImage !== nextImage &&
      prevImage.startsWith("/uploads/")
    ) {
      void deleteAvatarFile(prevImage);
    }
    reset(values);
    router.push(redirectTo as never);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate>
      <FieldGroup>
        <Controller
          name="image"
          control={control}
          render={({ field }) => (
            <Field className="items-center">
              <FieldLabel className="w-full text-center text-base">
                Avatar
              </FieldLabel>
              <AvatarUploader
                value={field.value ?? null}
                onChange={field.onChange}
                disabled={formState.isSubmitting}
              />
              {field.value !== defaultImage && (
                <p className="text-muted-foreground text-center text-xs">
                  Save changes to apply new avatar. Old file will be removed.
                </p>
              )}
            </Field>
          )}
        />
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
