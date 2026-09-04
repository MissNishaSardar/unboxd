import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/dbClient/prisma";

export type BrandWithCount = {
  slug: string;
  name: string;
  count: number;
};

export async function getBrandsWithCounts(params?: {
  q?: string;
  categories?: string[];
  min?: number;
  max?: number;
}): Promise<BrandWithCount[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const trimmedQ = params?.q?.trim();
  const where: Record<string, unknown> = { isActive: true };
  if (trimmedQ) {
    (where as Record<string, unknown>).OR = [
      { name: { contains: trimmedQ } },
      { description: { contains: trimmedQ } },
    ];
  }
  if (params?.categories && params.categories.length > 0) {
    (where as Record<string, unknown>).category = {
      slug: { in: params.categories },
      deletedAt: null,
    };
  }
  if (params?.min !== undefined || params?.max !== undefined) {
    (where as Record<string, unknown>).basePrice = {
      gte: params?.min,
      lte: params?.max,
    };
  }

  const grouped = await prisma.product.groupBy({
    by: ["brand", "brandSlug"],
    where: where as never,
    _count: { _all: true },
  });

  return grouped
    .filter((g) => g.brandSlug !== "unknown")
    .map((g) => ({
      slug: g.brandSlug,
      name: g.brand,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
