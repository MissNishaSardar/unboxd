"use client";

import Image from "next/image";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useFilePicker } from "use-file-picker";
import { FileSizeValidator } from "use-file-picker/validators";
import { Button } from "@/components/shadcnui/button";
import { toast } from "@/components/shadcnui/toast";
import { uploadAvatar } from "@/server/user/uploadAvatar";

const MAX_SIZE = 5 * 1024 * 1024;

type AvatarUploaderProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
};

const AvatarUploader = ({ value, onChange, disabled }: AvatarUploaderProps) => {
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
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex shrink-0 flex-col items-center gap-2">
        <button
          type="button"
          onClick={openFilePicker}
          disabled={disabled || uploading}
          aria-label={value ? "Change avatar" : "Upload avatar"}
          className="relative flex size-40 items-center justify-center overflow-hidden rounded-full border shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
          {preview ?
            <Image
              src={preview}
              alt="Avatar preview"
              fill
              unoptimized
              sizes="10rem"
              className="object-cover"
            />
          : <span className="bg-muted text-muted-foreground flex size-full items-center justify-center text-3xl font-semibold">
              ?
            </span>
          }
          {uploading && (
            <span className="bg-background/60 absolute inset-0 flex items-center justify-center">
              <Loader2Icon
                aria-hidden="true"
                className="size-6 animate-spin"
              />
            </span>
          )}
        </button>
        <span className="text-muted-foreground text-sm font-medium">
          {value ? "Change avatar" : "Upload avatar"}
        </span>
      </div>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          disabled={disabled || uploading}>
          <Trash2Icon aria-hidden="true" />
          Remove
        </Button>
      )}
    </div>
  );
};

export default AvatarUploader;
