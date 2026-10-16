import type { Metadata } from "next";
import Link from "next/link";
import ProductGrid from "@/components/Product/ProductGrid";
import ProductLoadMoreGrid from "@/components/Product/ProductLoadMoreGrid";
import ProductsEmpty from "@/components/Product/ProductsEmpty";
import { Button } from "@/components/shadcnui/button";
import { searchSearchParamsSchema } from "@/lib/zodSchema";
import { getFeaturedProducts, getProducts } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search the Unboxd catalog for phones, laptops, audio, and accessories.",
};

const TRENDING_TERMS = [
  "phone",
  "laptop",
  "headphones",
  "earbuds",
  "charger",
  "speaker",
] as const;

const SearchPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
  }>;
}) => {
  const sp = searchSearchParamsSchema.parse(await searchParams);
  const q = sp.q?.trim();

  if (!q) {
    const featured = (await getFeaturedProducts()).slice(0, 4);
    const trending = TRENDING_TERMS;
    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Search
          </h1>
          <p className="text-muted-foreground text-sm">
            Type in the header to search the catalog, or start below.
          </p>
        </header>
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Trending right now
          </p>
          <div className="flex flex-wrap gap-2">
            {trending.map((term) => (
              <Button
                key={term}
                variant="outline"
                size="sm"
                className="rounded-full"
                render={<Link href={`/search?q=${encodeURIComponent(term)}`} />}
                nativeButton={false}>
                {term}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Featured picks
            </h2>
            <Link
              href="/products"
              className="hover:text-primary text-xs underline underline-offset-4">
              View all
            </Link>
          </div>
          <ProductGrid products={featured} />
        </div>
      </div>
    );
  }

  const data = await getProducts({ q, page: sp.page });

  if (data.total === 0) {
    const featured = (await getFeaturedProducts()).slice(0, 4);
    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Search
          </h1>
        </header>

        <ProductsEmpty query={q} />

        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Try trending
          </p>
          <div className="flex flex-wrap gap-2">
            {TRENDING_TERMS.map((term) => (
              <Button
                key={term}
                variant="outline"
                size="sm"
                className="rounded-full"
                render={<Link href={`/search?q=${encodeURIComponent(term)}`} />}
                nativeButton={false}>
                {term}
              </Button>
            ))}
          </div>
        </div>

        {featured.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Featured picks
              </h2>
              <Link
                href="/products"
                className="hover:text-primary text-xs underline underline-offset-4">
                View all
              </Link>
            </div>
            <ProductGrid products={featured} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Search
        </h1>
        <p className="text-muted-foreground text-sm">
          {`${data.total} result${data.total === 1 ? "" : "s"} for "${q}"`}
        </p>
      </header>

      <ProductLoadMoreGrid
        initialProducts={data.products}
        total={data.total}
        query={q}
      />
    </div>
  );
};

export default SearchPage;
