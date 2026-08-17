import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StorageAdapter {
  save(buffer: Buffer, filename: string): Promise<string>;
}

class LocalStorage implements StorageAdapter {
  async save(buffer: Buffer, filename: string) {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return `/uploads/${filename}`;
  }
}

export const storage = new LocalStorage();
