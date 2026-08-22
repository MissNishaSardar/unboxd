"use client";

import Image from "next/image";
import { Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
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
    <div className="flex items-center gap-4">
      {preview ?
        <div className="relative size-24 shrink-0 overflow-hidden rounded-full border">
          <Image
            src={preview}
            alt="Avatar preview"
            fill
            unoptimized
            sizes="6rem"
            className="object-cover"
          />
        </div>
      : <div className="bg-muted text-muted-foreground flex size-24 shrink-0 items-center justify-center rounded-full border text-lg font-semibold">
          ?
        </div>
      }
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={openFilePicker}
          disabled={disabled || uploading}>
          {uploading ?
            <Loader2Icon
              className="animate-spin"
              aria-hidden="true"
            />
          : <UploadIcon aria-hidden="true" />}
          {value ? "Change avatar" : "Upload avatar"}
        </Button>
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
    </div>
  );
};

export default AvatarUploader;
