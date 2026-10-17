import { atom } from "jotai";
import type { ReviewDTO } from "@/server/reviews";

const cache = new Map<string, ReturnType<typeof atom<ReviewDTO[]>>>();

export function getReviewsAtom(slug: string) {
  let a = cache.get(slug);
  if (!a) {
    a = atom<ReviewDTO[]>([]);
    cache.set(slug, a);
  }
  return a;
}
