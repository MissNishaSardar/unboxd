import { NextResponse } from "next/server";
import { getSearchSuggestions } from "@/server/search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], brands: [] });
  }

  const data = await getSearchSuggestions(q);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
