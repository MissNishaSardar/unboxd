"use server";

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { requireAdmin } from "@/lib/guard";
import { storage } from "@/lib/storage/adapter";

const MAX_SIZE = 5 * 1024 * 1024;

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

  if (file.size > MAX_SIZE) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await sharp(buffer)
      .resize({ width: 1080, height: 1080, fit: "cover" })
      .jpeg({ quality: 97, mozjpeg: true })
      .toBuffer();

    const filename = `${randomUUID()}.jpg`;
    const url = await storage.save(processed, filename);

    return { ok: true, url };
  } catch {
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function deleteProductImageFile(
  url: string,
): Promise<{ ok: boolean }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false };
  }
  if (!url.startsWith("/uploads/")) return { ok: true };
  try {
    await storage.delete(url);
  } catch (e) {
    console.error("deleteProductImageFile failed", url, e);
  }
  return { ok: true };
}
