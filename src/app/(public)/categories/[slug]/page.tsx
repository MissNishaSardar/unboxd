import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import prisma from "@/lib/dbClient/prisma";
import { productListSearchParamsSchema } from "@/lib/zodSchema";
import { getBrandsWithCounts } from "@/server/brands";
import {
  getCategoriesWithCounts,
  getOnSaleProductIds,
  getProducts,
} from "@/server/catalog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findFirst({
    where: { slug, deletedAt: null },
    select: { name: true },
  });
  const name = category?.name ?? slug.replaceAll("-", " ");
  const title = name.charAt(0).toUpperCase() + name.slice(1);
  return {
    title,
    description: `Browse ${title} products on Unboxd.`,
  };
}

const page = async ({
  params,
  searchParams,
}: PageProps & {
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
  const { slug } = await params;
  const category = await prisma.category.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      parent: { select: { name: true, slug: true } },
      children: {
        where: { deletedAt: null },
        select: { name: true, slug: true },
        orderBy: [{ position: "asc" }, { name: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!category) notFound();

  const treeSlugs = [
    category.slug,
    ...category.children.map((child) => child.slug),
  ];
  const sp = productListSearchParamsSchema.parse(await searchParams);
  const selectedInTree = sp.categories.filter((item) =>
    treeSlugs.includes(item),
  );
  const effectiveCategories =
    selectedInTree.length > 0 ? selectedInTree : treeSlugs;
  const saleIds = sp.sale ? await getOnSaleProductIds() : null;

  const [data, categoriesInTree, brands] = await Promise.all([
    getProducts({
      q: sp.q,
      categories: effectiveCategories,
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
      categories: effectiveCategories,
      min: sp.min,
      max: sp.max,
      stock: sp.stock,
      saleProducts: saleIds,
    }),
  ]);

  const pills = categoriesInTree.filter((item) =>
    treeSlugs.includes(item.slug),
  );

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
              <BreadcrumbLink render={<Link href="/products" />}>
                Products
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {category.parent && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={
                      <Link href={`/categories/${category.parent.slug}`} />
                    }>
                    {category.parent.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{category.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <ProductSortMenu />
      </div>

      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-[2rem]">
          {category.name}
        </h1>
      </header>

      <section className="from-card/60 to-card/30 overflow-hidden rounded-[16px] border bg-gradient-to-b shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
        <div className="px-3.5 pt-3">
          <CategoryPillsRow categories={pills} />
        </div>
        <div className="bg-border h-px" />
        <ProductToolbar
          categories={pills}
          brands={brands}
          total={data.total}
        />
      </section>

      <ProductLoadMoreGrid
        initialProducts={data.products}
        total={data.total}
        baseCategories={treeSlugs}
      />
    </div>
  );
};

export default page;
