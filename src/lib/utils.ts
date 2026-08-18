import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn: typeof clsx = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
