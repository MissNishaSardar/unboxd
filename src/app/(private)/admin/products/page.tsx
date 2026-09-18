import Link from "next/link";
import type { Route } from "next";
import { PackageIcon, PlusIcon, XIcon } from "lucide-react";
import ProductSearch from "@/components/Admin/ProductSearch";
import AdminProductSortSelect from "@/components/Admin/AdminProductSortSelect";
import AdminProductsLoadMore from "@/components/Admin/AdminProductsLoadMore";
import { Button } from "@/components/shadcnui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/guard";
import { adminProductListSearchParamsSchema } from "@/lib/zodSchema";
import { getAdminProducts } from "@/server/admin/queries";

export const metadata: Metadata = {
  title: "Manage Products",
  description: "Manage the Unboxd product catalog.",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const STOCK_OPTIONS: { value: string; label: string; title?: string }[] = [
  { value: "all", label: "All" },
  {
    value: "low",
    label: "Low stock",
    title: "At least one variant with 1 to 4 units left",
  },
  {
    value: "out",
    label: "Out of stock",
    title: "At least one variant with 0 units left",
  },
];

const AdminProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await requireAdminPage();

  const {
    search,
    sort = "newest",
    status = "all",
    stock = "all",
  } = adminProductListSearchParamsSchema.parse(await searchParams);

  // The list uses Load more pagination, so the first render always shows
  // page 1. The ?page= param is only honored by /api/admin/products for
  // Load more requests.
  const { products, total } = await getAdminProducts({
    search,
    sort,
    status,
    stock,
    page: 1,
  });

  const hasActiveFilters =
    Boolean(search) || sort !== "newest" || status !== "all" || stock !== "all";

  const buildFilterHref = (next: { status?: string; stock?: string }) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sort !== "newest") params.set("sort", sort);
    const nextStatus = next.status ?? status;
    const nextStock = next.stock ?? stock;
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextStock !== "all") params.set("stock", nextStock);
    const query = params.toString();
    return `/admin/products${query ? `?${query}` : ""}` as Route;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Products
          </h1>
          <p className="text-muted-foreground text-sm">
            {total} product{total === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          render={<Link href="/admin/products/new" />}
          nativeButton={false}>
          <PlusIcon
            data-icon="inline-start"
            aria-hidden="true"
          />
          New product
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <ProductSearch />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div
            role="group"
            aria-label="Filter by status"
            className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Status:
            </span>
            {STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                render={
                  <Link href={buildFilterHref({ status: option.value })} />
                }
                nativeButton={false}
                variant={status === option.value ? "default" : "outline"}
                size="sm">
                {option.label}
              </Button>
            ))}
          </div>
          <div
            role="group"
            aria-label="Filter by stock"
            className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Stock:
            </span>
            {STOCK_OPTIONS.map((option) => (
              <Button
                key={option.value}
                render={
                  <Link href={buildFilterHref({ stock: option.value })} />
                }
                nativeButton={false}
                variant={stock === option.value ? "default" : "outline"}
                size="sm"
                title={option.title}>
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span
              id="admin-products-sort-label"
              className="text-muted-foreground text-xs font-medium">
              Sort:
            </span>
            <AdminProductSortSelect />
          </div>
          {hasActiveFilters && (
            <Button
              render={<Link href="/admin/products" />}
              nativeButton={false}
              variant="ghost"
              size="sm">
              <XIcon
                data-icon="inline-start"
                aria-hidden="true"
              />
              Clear filters
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-xs">
          Low stock means at least one variant with 1 to 4 units left. Out of
          stock means at least one variant at 0.
        </p>
      </div>

      {products.length === 0 ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No products found</EmptyTitle>
            <EmptyDescription>
              {search || status !== "all" || stock !== "all" ?
                "Try adjusting your search or filters."
              : "Create your first product to start selling."}
            </EmptyDescription>
          </EmptyHeader>
          {!search && status === "all" && stock === "all" && (
            <EmptyContent>
              <Button
                render={<Link href="/admin/products/new" />}
                nativeButton={false}>
                <PlusIcon
                  data-icon="inline-start"
                  aria-hidden="true"
                />
                New product
              </Button>
            </EmptyContent>
          )}
        </Empty>
      : <AdminProductsLoadMore
          initialProducts={products}
          total={total}
        />
      }
    </div>
  );
};

export default AdminProductsPage;
