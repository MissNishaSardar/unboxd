import Link from "next/link";
import { PackageIcon, PlusIcon } from "lucide-react";
import ProductSearch from "@/components/Admin/ProductSearch";
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

const STATUS_OPTIONS = ["all", "active", "inactive"] as const;

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
    page = 1,
  } = adminProductListSearchParamsSchema.parse(await searchParams);

  const { products, total } = await getAdminProducts({
    search,
    sort,
    status,
    page,
  });

  const buildStatusHref = (nextStatus: string) => ({
    pathname: "/admin/products" as const,
    query: {
      ...(search && { search }),
      ...(sort !== "newest" && { sort }),
      ...(nextStatus !== "all" && { status: nextStatus }),
    },
  });

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

      <div className="flex flex-wrap items-center gap-2">
        <ProductSearch />
        <div className="flex items-center gap-1">
          {STATUS_OPTIONS.map((option) => (
            <Button
              key={option}
              render={<Link href={buildStatusHref(option)} />}
              nativeButton={false}
              variant={status === option ? "default" : "outline"}
              size="sm">
              {option === "all" ?
                "All"
              : option === "active" ?
                "Active"
              : "Inactive"}
            </Button>
          ))}
        </div>
      </div>

      {products.length === 0 ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No products found</EmptyTitle>
            <EmptyDescription>
              {search || status !== "all" ?
                "Try adjusting your search or filters."
              : "Create your first product to start selling."}
            </EmptyDescription>
          </EmptyHeader>
          {!search && status === "all" && (
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
