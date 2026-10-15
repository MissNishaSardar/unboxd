import type { Metadata } from "next";
import CategoryPillsRow from "@/components/Product/CategoryPillsRow";
import ProductLoadMoreGrid from "@/components/Product/ProductLoadMoreGrid";
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
import { getCategoriesWithCounts, getProducts } from "@/server/catalog";
import { getBrandsWithCounts } from "@/server/brands";
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
    brands?: string | string[];
    brand?: string | string[];
    sort?: string | string[];
    min?: string | string[];
    max?: string | string[];
    page?: string | string[];
  }>;
}) => {
  const sp = productListSearchParamsSchema.parse(await searchParams);
  const [data, categories, brands, allCategories, allBrands] =
    await Promise.all([
      getProducts({
        q: sp.q,
        categories: sp.categories,
        brands: sp.brands,
        sort: sp.sort,
        min: sp.min,
        max: sp.max,
        page: sp.page,
      }),
      getCategoriesWithCounts({
        q: sp.q,
        brands: sp.brands,
        min: sp.min,
        max: sp.max,
      }),
      getBrandsWithCounts({
        q: sp.q,
        categories: sp.categories,
        min: sp.min,
        max: sp.max,
      }),
      getCategoriesWithCounts(),
      getBrandsWithCounts(),
    ]);

  const brandNameMap = new Map(
    [...brands, ...allBrands].map((b) => [b.slug, b.name] as const),
  );

  const categoryNameMap = new Map(
    [...categories, ...allCategories].map((c) => [c.slug, c.name] as const),
  );

  const activeBrandNames = sp.brands.map(
    (slug) => brandNameMap.get(slug) ?? slug,
  );
  const activeCategoryNames = sp.categories.map(
    (slug) => categoryNameMap.get(slug) ?? slug,
  );

  const hasActiveFilter =
    activeBrandNames.length > 0 || activeCategoryNames.length > 0;

  return (
    <div className="-mt-8 flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {hasActiveFilter ?
                <BreadcrumbLink render={<Link href="/products" />}>
                  Products
                </BreadcrumbLink>
              : <BreadcrumbPage>Products</BreadcrumbPage>}
            </BreadcrumbItem>
            {activeBrandNames.map((name) => (
              <span
                key={`brand-${name}`}
                className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                </BreadcrumbItem>
              </span>
            ))}
            {activeCategoryNames.map((name) => (
              <span
                key={`cat-${name}`}
                className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
            Products
          </h1>
          <p className="text-muted-foreground text-sm tabular-nums">
            {data.total} item{data.total === 1 ? "" : "s"} •{" "}
            {sp.categories.length === 0 ?
              "All categories"
            : sp.categories.join(", ")}{" "}
            {sp.brands.length > 0 && `• ${sp.brands.join(", ")}`}
          </p>
        </header>
      </div>

      <CategoryPillsRow categories={categories} />

      <div className="flex min-w-0 flex-col gap-4">
        <ProductToolbar
          categories={categories}
          brands={brands}
        />
        <ProductLoadMoreGrid
          initialProducts={data.products}
          total={data.total}
        />
      </div>
    </div>
  );
};

export default ProductsPage;
