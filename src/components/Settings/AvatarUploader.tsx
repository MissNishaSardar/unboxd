"use client";

import { CameraIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useFilePicker } from "use-file-picker";
import { FileSizeValidator } from "use-file-picker/validators";
import { toast } from "@/components/shadcnui/toast";
import { uploadAvatar } from "@/server/user/uploadAvatar";

const MAX_SIZE = 5 * 1024 * 1024;

// Fallback gradient for missing avatars, matches the conic identity ring
const FALLBACK_GRADIENT =
  "radial-gradient(130% 120% at 18% 12%, rgba(56,189,248,0.9), transparent 58%), " +
  "linear-gradient(152deg, #0a4f6e 8%, #0ea5e9 92%)";

type AvatarUploaderProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  initials?: string;
};

// Compact hero avatar: conic status ring, camera badge, small remove link
const AvatarUploader = ({
  value,
  onChange,
  disabled,
  initials,
}: AvatarUploaderProps) => {
  const [uploading, setUploading] = useState(false);

  const { openFilePicker, filesContent } = useFilePicker({
    accept: "image/*",
    multiple: false,
    readAs: "DataURL",
    validators: [new FileSizeValidator({ maxFileSize: MAX_SIZE })],
    onFilesRejected: ({ errors }) => {
      const error = errors[0];
      const reason = error && "reason" in error ? error.reason : undefined;
      toast.add({
        title:
          reason === "FILE_SIZE_TOO_LARGE" ?
            "Image must be under 5MB"
          : "Only images are accepted",
        type: "error",
      });
    },
    onFilesSuccessfullySelected: async ({ plainFiles }) => {
      const file = plainFiles[0];
      if (!file) return;
      setUploading(true);
      try {
        const result = await uploadAvatar(file);
        if (!result.ok) throw new Error(result.error);
        onChange(result.url);
        toast.add({ title: "Image uploaded", type: "success" });
      } catch (error) {
        toast.add({
          title:
            error instanceof Error && error.message === "FORBIDDEN" ?
              "Sign in again to upload"
            : error instanceof Error && error.message === "INVALID_INPUT" ?
              "Only images under 5MB are accepted"
            : "Upload failed",
          type: "error",
        });
      } finally {
        setUploading(false);
      }
    },
  });

  const preview = value ?? filesContent[0]?.content ?? null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-[136px]">
        {/* Conic accent ring */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 210deg, var(--primary), #0a5a7c 55%, transparent 55%)",
          }}
        />
        <span
          aria-hidden
          className="bg-card absolute inset-[3px] rounded-full"
        />
        {/* Photo, opens the picker, keyboard reachable */}
        <button
          type="button"
          onClick={openFilePicker}
          disabled={disabled || uploading}
          aria-label={value ? "Change avatar" : "Upload avatar"}
          style={preview ? undefined : { background: FALLBACK_GRADIENT }}
          className="focus-visible:ring-ring focus-visible:ring-offset-card absolute inset-[6px] z-[1] flex items-center justify-center overflow-hidden rounded-full transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
          {preview ?
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Avatar preview"
              className="size-full object-cover"
            />
          : <span className="text-[34px] font-semibold tracking-tight text-[#eaf8ff]">
              {initials || "?"}
            </span>
          }
          {uploading && (
            <span className="bg-background/60 absolute inset-0 grid place-items-center backdrop-blur-[2px]">
              <Loader2Icon
                className="size-5 animate-spin"
                aria-hidden
              />
            </span>
          )}
        </button>
        {/* Camera badge, second affordance for the picker */}
        <button
          type="button"
          onClick={openFilePicker}
          disabled={disabled || uploading}
          aria-label={value ? "Change avatar" : "Upload avatar"}
          className="border-card bg-primary text-primary-foreground absolute right-0 bottom-0 z-10 grid size-9 place-items-center rounded-full border-[3px] transition-transform hover:scale-105 disabled:pointer-events-none disabled:opacity-60">
          <CameraIcon
            className="size-4"
            aria-hidden
          />
        </button>
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled || uploading}
          className="text-muted-foreground hover:text-destructive inline-flex items-center gap-1 text-[11.5px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-60">
          <Trash2Icon
            className="size-3"
            aria-hidden
          />
          Remove
        </button>
      )}
    </div>
  );
};

export default AvatarUploader;
