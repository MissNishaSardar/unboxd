import Link from "next/link";
import { PackageIcon, PlusIcon } from "lucide-react";
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
import { getStoreSettings } from "@/server/admin/settings";

export const metadata: Metadata = {
  title: "Manage Products",
  description: "Manage the Unboxd product catalog.",
};

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
  const [{ products, total }, { lowStockThreshold }] = await Promise.all([
    getAdminProducts({
      search,
      sort,
      status,
      stock,
      page: 1,
    }),
    getStoreSettings(),
  ]);

  const hasActiveFilters =
    Boolean(search) || sort !== "newest" || status !== "all" || stock !== "all";

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

      {products.length === 0 && !hasActiveFilters ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No products found</EmptyTitle>
            <EmptyDescription>
              Create your first product to start selling.
            </EmptyDescription>
          </EmptyHeader>
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
        </Empty>
      : <AdminProductsLoadMore
          initialProducts={products}
          total={total}
          lowStockThreshold={lowStockThreshold}
        />
      }
    </div>
  );
};

export default AdminProductsPage;
