"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  PencilIcon,
} from "lucide-react";
import ProductActions from "@/components/Admin/ProductActions";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Checkbox } from "@/components/shadcnui/checkbox";
import { formatPrice, formatDate } from "@/lib/format";
import {
  activeDiscountPercent,
  dealStatus,
  discountBadge,
  effectivePrice,
  hasDiscount,
} from "@/lib/pricing";
import { formatISTRange } from "@/lib/deals";

export type AdminProductFlaggedVariant = {
  id: string;
  name: string;
  sku: string;
  stock: number;
};

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  basePrice: string;
  discountPercent: number;
  discountStartsAt: string | null;
  discountEndsAt: string | null;
  isActive: boolean;
  featured?: boolean;
  categoryName: string;
  createdAt: string;
  imageUrl: string;
  totalStock: number;
  variantCount: number;
  flaggedVariants: AdminProductFlaggedVariant[];
};

const SortHeaderButton = ({
  label,
  sorted,
  onToggle,
}: {
  label: string;
  sorted: false | "asc" | "desc";
  onToggle: () => void;
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onToggle}
    aria-label={`Sort by ${label}`}>
    {label}
    {sorted === "asc" ?
      <ArrowUpIcon
        data-icon="inline-end"
        aria-hidden="true"
      />
    : sorted === "desc" ?
      <ArrowDownIcon
        data-icon="inline-end"
        aria-hidden="true"
      />
    : <ArrowUpDownIcon
        data-icon="inline-end"
        aria-hidden="true"
      />
    }
  </Button>
);

const DealBadges = ({ product }: { product: AdminProductRow }) => {
  const dealWindow = {
    discountPercent: product.discountPercent,
    discountStartsAt: product.discountStartsAt,
    discountEndsAt: product.discountEndsAt,
  };
  const active = activeDiscountPercent(dealWindow);
  const status = dealStatus(dealWindow);
  const range = formatISTRange(
    product.discountStartsAt,
    product.discountEndsAt,
  );
  const endedLabel = range ? `Deal ended, ${range}` : "Deal ended";
  return (
    <span className="flex items-center justify-end gap-1.5">
      {formatPrice(effectivePrice(Number(product.basePrice), 0, active))}
      {hasDiscount(active) && (
        <Badge variant="secondary">{discountBadge(active)}</Badge>
      )}
      {status !== "none" && (
        <Badge
          variant={status === "live" ? "default" : "outline"}
          title={status === "expired" ? endedLabel : range}
          aria-label={
            status === "live" ? "Live deal"
            : status === "scheduled" ?
              "Scheduled deal"
            : endedLabel
          }>
          {status === "live" ?
            "Live deal"
          : status === "scheduled" ?
            "Scheduled"
          : "Deal ended"}
        </Badge>
      )}
    </span>
  );
};

export const getProductsColumns = (): ColumnDef<AdminProductRow>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) =>
          table.toggleAllPageRowsSelected(checked === true)
        }
        aria-label="Select all products"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        indeterminate={false}
        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
        disabled={!row.getCanSelect()}
        aria-label={`Select product ${row.original.name}`}
      />
    ),
    enableSorting: false,
  },
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <SortHeaderButton
        label="Product"
        sorted={column.getIsSorted()}
        onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Image
          src={row.original.imageUrl}
          alt={row.original.name}
          width={40}
          height={40}
          unoptimized
          className="size-10 shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0">
          {row.original.isActive ?
            <Link
              href={`/products/${row.original.slug}` as Route}
              target="_blank"
              rel="noopener noreferrer"
              title="View storefront page"
              className="truncate text-sm font-medium hover:underline">
              {row.original.name}
            </Link>
          : <p className="truncate text-sm font-medium">{row.original.name}</p>}
          <p className="text-muted-foreground truncate text-xs">
            {row.original.slug}
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "category",
    accessorKey: "categoryName",
    header: "Category",
    cell: ({ row }) => <span>{row.original.categoryName}</span>,
    enableSorting: false,
  },
  {
    id: "price",
    accessorKey: "basePrice",
    header: ({ column }) => (
      <div className="flex justify-end">
        <SortHeaderButton
          label="Price"
          sorted={column.getIsSorted()}
          onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      </div>
    ),
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        <DealBadges product={row.original} />
      </span>
    ),
  },
  {
    id: "stock",
    header: () => <div className="flex justify-end">Stock</div>,
    cell: ({ row }) => {
      const total = row.original.totalStock;
      const count = row.original.variantCount;
      const stockLabel = `${total} across ${count} variant${count === 1 ? "" : "s"}`;
      return (
        <span className="block text-right whitespace-nowrap tabular-nums">
          {row.original.flaggedVariants.length > 0 ?
            <span className="flex flex-col items-end gap-1">
              {row.original.flaggedVariants.map((variant) => (
                <span
                  key={variant.id}
                  className="flex items-baseline justify-end gap-1.5 text-sm">
                  <span className="min-w-0 truncate font-medium">
                    {variant.name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {variant.sku}
                  </span>
                  <span
                    className={
                      variant.stock === 0 ?
                        "text-destructive font-semibold"
                      : "font-semibold text-amber-600 dark:text-amber-400"
                    }>
                    {variant.stock}
                  </span>
                </span>
              ))}
              <span
                className="text-muted-foreground text-xs whitespace-nowrap tabular-nums"
                title={stockLabel}
                aria-label={`Total stock: ${stockLabel}`}>
                Total {total}
              </span>
            </span>
          : <span
              title={stockLabel}
              aria-label={`Stock: ${stockLabel}`}>
              {total}
            </span>
          }
        </span>
      );
    },
    enableSorting: false,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "outline"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    id: "variants",
    header: () => <div className="flex justify-end">Variants</div>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {row.original.variantCount}
      </span>
    ),
    enableSorting: false,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortHeaderButton
        label="Created"
        sorted={column.getIsSorted()}
        onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="flex justify-end">Actions</span>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          render={
            <Link href={`/admin/products/${row.original.id}/edit` as Route} />
          }
          nativeButton={false}
          variant="ghost"
          size="sm">
          <PencilIcon
            data-icon="inline-start"
            aria-hidden="true"
          />
          Edit
        </Button>
        <ProductActions
          id={row.original.id}
          isActive={row.original.isActive}
        />
      </div>
    ),
    enableSorting: false,
  },
];
