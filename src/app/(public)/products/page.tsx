import type { Metadata } from "next";
import FilterSidebar from "@/components/Product/FilterSidebar";
import Pagination from "@/components/Product/Pagination";
import ProductGrid from "@/components/Product/ProductGrid";
import { productListSearchParamsSchema } from "@/lib/zodSchema";
import { getCategoriesWithCounts, getProducts } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Products — Unboxd",
  description: "Browse our electronics catalog with filters and sorting.",
};

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string | string[];
    sort?: string | string[];
    min?: string | string[];
    max?: string | string[];
    page?: string | string[];
  }>;
}) => {
  const sp = productListSearchParamsSchema.parse(await searchParams);

  const [data, categories] = await Promise.all([
    getProducts({
      category: sp.category,
      sort: sp.sort,
      min: sp.min,
      max: sp.max,
      page: sp.page,
    }),
    getCategoriesWithCounts(),
  ]);

  return (
    <div className="flex flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Products
        </h1>
        <p className="text-muted-foreground text-sm">
          {data.total} item{data.total === 1 ? "" : "s"}
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row">
        <FilterSidebar categories={categories} />
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <ProductGrid products={data.products} />
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
