import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StorageAdapter {
  save(buffer: Buffer, filename: string): Promise<string>;
  delete(url: string): Promise<void>;
}

class LocalStorage implements StorageAdapter {
  async save(buffer: Buffer, filename: string) {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return `/uploads/${filename}`;
  }

  async delete(url: string) {
    if (!url.startsWith("/uploads/")) return;
    const filename = path.basename(url);
    await rm(path.join(process.cwd(), "public", "uploads", filename), {
      force: true,
    });
  }
}

export const storage = new LocalStorage();
