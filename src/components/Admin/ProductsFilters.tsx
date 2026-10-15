"use client";

import Link from "next/link";
import type { Route } from "next";
import { useSearchParams } from "next/navigation";
import { XIcon } from "lucide-react";
import ProductSearch from "@/components/Admin/ProductSearch";
import AdminProductSortSelect from "@/components/Admin/AdminProductSortSelect";
import { Button } from "@/components/shadcnui/button";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const ProductsFilters = ({
  lowStockThreshold = 5,
}: {
  lowStockThreshold?: number;
}) => {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const status = searchParams.get("status") ?? "all";
  const stock = searchParams.get("stock") ?? "all";
  const lowTop = Math.max(1, lowStockThreshold - 1);
  const lowCopy = `At least one variant with 1 to ${lowTop} units left`;

  const STOCK_OPTIONS: { value: string; label: string; title?: string }[] = [
    { value: "all", label: "All" },
    {
      value: "low",
      label: "Low stock",
      title: lowCopy,
    },
    {
      value: "out",
      label: "Out of stock",
      title: "At least one variant with 0 units left",
    },
  ];

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
              render={<Link href={buildFilterHref({ status: option.value })} />}
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
              render={<Link href={buildFilterHref({ stock: option.value })} />}
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
        Low stock means {lowCopy.toLowerCase()}. Out of stock means at least one
        variant at 0.
      </p>
    </div>
  );
};

export default ProductsFilters;
