import type { Metadata } from "next";
import Link from "next/link";
import CategoryPillsRow from "@/components/Product/CategoryPillsRow";
import ProductLoadMoreGrid from "@/components/Product/ProductLoadMoreGrid";
import ProductSortMenu from "@/components/Product/ProductSortMenu";
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
  getOnSaleProductIds,
  getProducts,
} from "@/server/catalog";
import { getBrandsWithCounts } from "@/server/brands";

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
    sale?: string | string[];
    stock?: string | string[];
  }>;
}) => {
  const sp = productListSearchParamsSchema.parse(await searchParams);
  const saleIds = sp.sale ? await getOnSaleProductIds() : null;
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
        stock: sp.stock,
        saleProducts: saleIds,
      }),
      getCategoriesWithCounts({
        q: sp.q,
        brands: sp.brands,
        min: sp.min,
        max: sp.max,
        stock: sp.stock,
        saleProducts: saleIds,
      }),
      getBrandsWithCounts({
        q: sp.q,
        categories: sp.categories,
        min: sp.min,
        max: sp.max,
        stock: sp.stock,
        saleProducts: saleIds,
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
    <div className="-mt-8 flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <ProductSortMenu />
      </div>

      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-[2rem]">
          Products
        </h1>
      </header>

      <section className="from-card/60 to-card/30 overflow-hidden rounded-[16px] border bg-gradient-to-b shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
        <div className="px-3.5 pt-3">
          <CategoryPillsRow categories={categories} />
        </div>
        <div className="bg-border h-px" />
        <ProductToolbar
          categories={categories}
          brands={brands}
          total={data.total}
        />
      </section>

      <ProductLoadMoreGrid
        initialProducts={data.products}
        total={data.total}
      />
    </div>
  );
};

export default ProductsPage;
