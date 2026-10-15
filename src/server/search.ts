import prisma from "@/lib/dbClient/prisma";
import { productCardInclude, toProductCardData } from "@/server/catalog";
import { getActiveSalePercent } from "@/server/deals";

export type SearchSuggestionBrand = {
  slug: string;
  name: string;
  count: number;
};

export type SearchSuggestionProduct = ReturnType<typeof toProductCardData>;

export async function getSearchSuggestions(q: string) {
  const trimmed = q.trim().slice(0, 100);
  if (!trimmed || trimmed.length < 2) {
    return {
      products: [] as SearchSuggestionProduct[],
      brands: [] as SearchSuggestionBrand[],
    };
  }

  const [products, brandGroups] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: trimmed } },
          { description: { contains: trimmed } },
          { brand: { contains: trimmed } },
        ],
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 6,
      include: productCardInclude,
    }),
    prisma.product.groupBy({
      by: ["brand", "brandSlug"],
      where: {
        isActive: true,
        brand: { contains: trimmed },
      },
      _count: { _all: true },
    }),
  ]);

  const brands: SearchSuggestionBrand[] = brandGroups
    .map((g) => ({
      slug: g.brandSlug,
      name: g.brand,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 3);

  const salePercent = await getActiveSalePercent();

  return {
    products: products.map((product) =>
      toProductCardData(product, salePercent),
    ),
    brands,
  };
}
