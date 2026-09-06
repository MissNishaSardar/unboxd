import { NextResponse } from "next/server";
import { getProducts } from "@/server/catalog";
import { productListSearchParamsSchema } from "@/lib/zodSchema";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = productListSearchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );
  const data = await getProducts({
    q: parsed.q,
    categories: parsed.categories,
    brands: parsed.brands,
    sort: parsed.sort,
    min: parsed.min,
    max: parsed.max,
    page: parsed.page ?? 1,
  });
  return NextResponse.json(
    {
      products: data.products,
      total: data.total,
      totalPages: data.totalPages,
      page: data.page,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
