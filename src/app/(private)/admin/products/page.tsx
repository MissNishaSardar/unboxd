import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { PackageIcon, PencilIcon, PlusIcon } from "lucide-react";
import ProductActions from "@/components/Admin/ProductActions";
import ProductSearch from "@/components/Admin/ProductSearch";
import Pagination from "@/components/Product/Pagination";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent } from "@/components/shadcnui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import type { Metadata } from "next";
import { formatPrice } from "@/lib/format";
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

  const { products, total, totalPages } = await getAdminProducts({
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
      : <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.imageUrl ?
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={40}
                            height={40}
                            unoptimized
                            className="size-10 shrink-0 rounded-md object-cover"
                          />
                        : <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                            <PackageIcon
                              className="text-muted-foreground size-4"
                              aria-hidden="true"
                            />
                          </div>
                        }
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {product.name}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.categoryName}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatPrice(Number(product.basePrice))}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {product.totalStock}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {product.variantCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          render={
                            <Link
                              href={
                                `/admin/products/${product.id}/edit` as Route
                              }
                            />
                          }
                          nativeButton={false}
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${product.name}`}>
                          <PencilIcon aria-hidden="true" />
                        </Button>
                        <ProductActions
                          id={product.id}
                          isActive={product.isActive}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      }

      {products.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pathname="/admin/products"
        />
      )}
    </div>
  );
};

export default AdminProductsPage;
