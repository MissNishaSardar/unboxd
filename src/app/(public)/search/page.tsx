import type { Metadata } from "next";
import Pagination from "@/components/Product/Pagination";
import ProductGrid from "@/components/Product/ProductGrid";
import { searchSearchParamsSchema } from "@/lib/zodSchema";
import { getProducts } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search the Unboxd catalog for phones, laptops, audio, and accessories.",
};

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
    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Search
          </h1>
          <p className="text-muted-foreground text-sm">
            Type in the header to search the catalog.
          </p>
        </header>
      </div>
    );
  }

  const data = await getProducts({ q, page: sp.page });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Search
        </h1>
        <p className="text-muted-foreground text-sm">
          {data.total === 0 ?
            `No results for "${q}"`
          : `${data.total} result${data.total === 1 ? "" : "s"} for "${q}"`}
        </p>
      </header>

      <ProductGrid products={data.products} />
      {data.total > 0 && data.totalPages > 1 && (
        <Pagination
          currentPage={data.page}
          totalPages={data.totalPages}
          pathname="/search"
        />
      )}
    </div>
  );
};

export default SearchPage;
