import type { Metadata } from "next";
import CategoryPillsRow from "@/components/Product/CategoryPillsRow";
import Pagination from "@/components/Product/Pagination";
import ProductGrid from "@/components/Product/ProductGrid";
import ProductsHero from "@/components/Product/ProductsHero";
import ProductToolbar from "@/components/Product/ProductToolbar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/shadcnui/breadcrumb";
import { productListSearchParamsSchema } from "@/lib/zodSchema";
import {
  getCategoriesWithCounts,
  getFeaturedProducts,
  getProducts,
} from "@/server/catalog";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our electronics catalog with filters and sorting.",
};

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    categories?: string | string[];
    category?: string | string[];
    sort?: string | string[];
    min?: string | string[];
    max?: string | string[];
    page?: string | string[];
  }>;
}) => {
  const sp = productListSearchParamsSchema.parse(await searchParams);
  const isFiltered = Boolean(
    sp.q || sp.categories.length > 0 || sp.min != null || sp.max != null,
  );

  const [data, categories, featured] = await Promise.all([
    getProducts({
      q: sp.q,
      categories: sp.categories,
      sort: sp.sort,
      min: sp.min,
      max: sp.max,
      page: sp.page,
    }),
    getCategoriesWithCounts({
      q: sp.q,
      min: sp.min,
      max: sp.max,
    }),
    getFeaturedProducts(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {!isFiltered && <ProductsHero products={featured.slice(0, 5)} />}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Products</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Products
        </h1>
        <p className="text-muted-foreground text-sm tabular-nums">
          {data.total} item{data.total === 1 ? "" : "s"} •{" "}
          {sp.categories.length === 0 ?
            "All categories"
          : sp.categories.join(", ")}
        </p>
      </header>

      <CategoryPillsRow categories={categories} />

      <div className="flex min-w-0 flex-col gap-4">
        <ProductToolbar categories={categories} />
        <ProductGrid products={data.products} />
        {data.total > 0 && data.totalPages > 1 && (
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
          />
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
