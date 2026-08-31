"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage/adapter";

const MAX_SIZE = 5 * 1024 * 1024;

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: "FORBIDDEN" | "INVALID_INPUT" | "SERVER_ERROR" };

export async function uploadAvatar(file: File): Promise<UploadResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "FORBIDDEN" };

  if (!(file instanceof File)) return { ok: false, error: "INVALID_INPUT" };
  if (file.size > MAX_SIZE) return { ok: false, error: "INVALID_INPUT" };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await sharp(buffer)
      .resize({ width: 512, height: 512, fit: "cover" })
      .jpeg({ quality: 97, mozjpeg: true })
      .toBuffer();

    const filename = `${randomUUID()}.jpg`;
    const url = await storage.save(processed, filename);
    return { ok: true, url };
  } catch {
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function deleteAvatarFile(url: string): Promise<{ ok: boolean }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false };
  if (!url.startsWith("/uploads/")) return { ok: true };
  try {
    await storage.delete(url);
  } catch (e) {
    console.error("deleteAvatarFile failed", url, e);
  }
  return { ok: true };
}
