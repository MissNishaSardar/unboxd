import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import prisma from "@/lib/dbClient/prisma";
import { productListSearchParamsSchema } from "@/lib/zodSchema";
import { getBrandsWithCounts } from "@/server/brands";
import { getCategoriesWithCounts, getProducts } from "@/server/catalog";

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
        orderBy: { name: "asc" },
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

  const [data, categoriesInTree, brands] = await Promise.all([
    getProducts({
      q: sp.q,
      categories: effectiveCategories,
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
      categories: effectiveCategories,
      min: sp.min,
      max: sp.max,
    }),
  ]);

  const pills = categoriesInTree.filter((item) =>
    treeSlugs.includes(item.slug),
  );

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
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
            {category.name}
          </h1>
          <p className="text-muted-foreground text-sm tabular-nums">
            {data.total} item{data.total === 1 ? "" : "s"} in this category
            {category.children.length > 0 &&
              selectedInTree.length === 0 &&
              `, including ${category.children.map((child) => child.name).join(", ")}`}
          </p>
        </header>
      </div>

      <CategoryPillsRow categories={pills} />

      <div className="flex min-w-0 flex-col gap-4">
        <ProductToolbar
          categories={pills}
          brands={brands}
        />
        <ProductLoadMoreGrid
          initialProducts={data.products}
          total={data.total}
          baseCategories={treeSlugs}
        />
      </div>
    </div>
  );
};

export default page;
