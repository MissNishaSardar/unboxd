"use client";

import Image from "next/image";
import { Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { useState } from "react";
import { useFilePicker } from "use-file-picker";
import {
  FileSizeValidator,
  FileTypeValidator,
} from "use-file-picker/validators";
import { Button } from "@/components/shadcnui/button";
import { toast } from "@/components/shadcnui/toast";
import { cn } from "@/lib/utils";

const MAX_SIZE = 5 * 1024 * 1024;

const ImageUploader = ({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
}) => {
  const [uploading, setUploading] = useState(false);

  const { openFilePicker, filesContent } = useFilePicker({
    accept: "image/*",
    multiple: false,
    readAs: "DataURL",
    validators: [
      new FileTypeValidator(["jpeg", "png", "webp"]),
      new FileSizeValidator({ maxFileSize: MAX_SIZE }),
    ],
    onFilesRejected: ({ errors }) => {
      const error = errors[0];
      const reason = error && "reason" in error ? error.reason : undefined;
      toast.add({
        title:
          reason === "FILE_SIZE_TOO_LARGE" ?
            "Image must be under 5MB"
          : "Only JPG, PNG, or WebP images are accepted",
        type: "error",
      });
    },
    onFilesSuccessfullySelected: async ({ plainFiles }) => {
      const file = plainFiles[0];
      if (!file) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        onChange(data.url as string);
        toast.add({ title: "Image uploaded", type: "success" });
      } catch {
        toast.add({ title: "Upload failed", type: "error" });
      } finally {
        setUploading(false);
      }
    },
  });

  const preview = value ?? filesContent[0]?.content ?? null;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {preview && (
        <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-lg border">
          <Image
            src={preview}
            alt="Product image preview"
            fill
            sizes="8rem"
            className="object-cover"
          />
        </div>
      )}
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
          {value ? "Replace image" : "Choose image"}
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

export default ImageUploader;
