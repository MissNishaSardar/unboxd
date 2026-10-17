"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarIcon,
  CheckIcon,
  Loader2Icon,
  MailXIcon,
  PencilIcon,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { profileUpdateSchema, profileUpdateType } from "@/lib/zodSchema";
import { deleteAvatarFile } from "@/server/user/uploadAvatar";
import AvatarUploader from "@/components/Settings/AvatarUploader";
import UserStatusBadge from "@/components/Admin/UserStatusBadge";
import { Button } from "@/components/shadcnui/button";
import { toast } from "@/components/shadcnui/toast";
import type { ProfileView } from "@/server/user/profile";

const EYEBROW =
  "text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground";

const CHIP =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium";

type ProfileFormProps = {
  view: ProfileView;
};

// Identity hero for /myprofile. One avatar, one name. View mode shows the
// static Fraunces name, edit mode swaps in the dashed inline input and the
// tinted save strip. Avatar uploads apply on save.
const ProfileForm = ({ view }: ProfileFormProps) => {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  const { getValues, handleSubmit, control, formState, reset } =
    useForm<profileUpdateType>({
      resolver: zodResolver(profileUpdateSchema),
      defaultValues: {
        name: view.name,
        image: view.image,
      },
      mode: "all",
    });

  const onSubmit = async (values: profileUpdateType) => {
    const prevImage = view.image;
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
    setEditing(false);
    router.refresh();
  };

  const discard = () => {
    // Eager uploads write the file immediately, so discard must remove the
    // pending file or it would stay orphaned under public/uploads.
    const pendingImage = getValues("image");
    if (
      typeof pendingImage === "string" &&
      pendingImage !== view.image &&
      pendingImage.startsWith("/uploads/")
    ) {
      void deleteAvatarFile(pendingImage);
    }
    reset();
    setEditing(false);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate>
      {/* Identity row, avatar left, name and record chips right */}
      <div className="relative px-6 pt-8 pb-7 sm:px-10">
        {!editing && (
          <div className="absolute top-4 right-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditing(true)}
              className="rounded-full px-3.5 text-xs shadow-xs">
              <PencilIcon
                className="size-3"
                aria-hidden
              />
              Edit profile
            </Button>
          </div>
        )}

        <div className="grid items-center justify-items-center gap-7 text-center sm:grid-cols-[auto_minmax(0,1fr)] sm:justify-items-start sm:gap-7 sm:text-left">
          <Controller
            name="image"
            control={control}
            render={({ field }) => (
              <AvatarUploader
                value={field.value ?? null}
                onChange={(url) => {
                  field.onChange(url ?? null);
                  if (!editing) setEditing(true);
                }}
                disabled={formState.isSubmitting}
                initials={view.initials}
              />
            )}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              {editing ?
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="min-w-0">
                      <input
                        {...field}
                        id="profile-name"
                        aria-label="Name"
                        type="text"
                        autoComplete="name"
                        aria-invalid={fieldState.invalid || undefined}
                        className={cn(
                          "border-input font-heading placeholder:text-muted-foreground/50 focus:border-primary w-full max-w-[340px] border-0 border-b-2 border-dashed bg-transparent pb-1 text-[26px] font-semibold tracking-tight outline-none",
                          fieldState.invalid &&
                            "border-destructive focus:border-destructive",
                        )}
                      />
                      {fieldState.invalid && (
                        <p className="text-destructive mt-1 text-xs">
                          {fieldState.error?.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              : <h2 className="font-heading text-[27px] leading-tight font-semibold tracking-tight">
                  {view.name}
                </h2>
              }
              {view.emailVerified ?
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckIcon
                    className="size-3"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  Verified
                </span>
              : <span className="text-muted-foreground inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-[11.5px] font-medium">
                  <MailXIcon
                    className="size-3"
                    aria-hidden
                  />
                  Not verified
                </span>
              }
            </div>

            <div className="mt-2 flex items-center justify-center gap-2.5 sm:justify-start">
              <span className={EYEBROW}>Email</span>
              <span
                className="text-muted-foreground truncate text-[13.5px]"
                title={view.email}>
                {view.email}
              </span>
            </div>

            <div className="mt-3">
              <span className={EYEBROW}>Account</span>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className={CHIP}>
                  <UserIcon
                    className="size-3 opacity-70"
                    aria-hidden
                  />
                  <span className="capitalize">{view.role}</span>
                </span>
                <UserStatusBadge
                  banned={view.banned}
                  banExpires={view.banExpires}
                  deletedAt={view.deletedAt}
                />
                <span className={CHIP}>
                  <CalendarIcon
                    className="size-3 opacity-70"
                    aria-hidden
                  />
                  Member since {formatDate(view.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save strip, edit mode only */}
      {editing && (
        <div className="border-border bg-primary/[0.06] border-y">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 sm:px-10">
            <span className="text-muted-foreground flex items-center gap-2 text-xs">
              <span
                aria-hidden
                className="bg-primary size-[7px] rounded-full"
                style={{
                  boxShadow:
                    "0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent)",
                }}
              />
              {formState.isDirty ?
                "Unsaved changes, apply your new avatar and name"
              : "Nothing to save yet"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={discard}
                className="text-muted-foreground h-7 rounded-full px-3 text-xs">
                Discard
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={formState.isSubmitting || !formState.isDirty}
                className="h-7 rounded-full px-3.5 text-xs">
                {formState.isSubmitting && (
                  <Loader2Icon
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                )}
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default ProfileForm;
