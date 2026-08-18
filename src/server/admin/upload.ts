"use server";

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { requireAdmin } from "@/lib/guard";
import { storage } from "@/lib/storage/adapter";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: "FORBIDDEN" | "INVALID_INPUT" | "SERVER_ERROR" };

export async function uploadImage(file: File): Promise<UploadResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  if (!(file instanceof File)) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  if (file.size > MAX_SIZE) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await sharp(buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const filename = `${randomUUID()}.webp`;
    const url = await storage.save(processed, filename);

    return { ok: true, url };
  } catch {
    return { ok: false, error: "SERVER_ERROR" };
  }
}
