"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import type {
  ColumnDef,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";
import type { RowSelectionState } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import DataTable from "@/components/Admin/DataTable";
import { Button } from "@/components/shadcnui/button";
import { formatPrice } from "@/lib/format";

export type AdminOrderItemRow = {
  id: string;
  productId: string;
  nameSnapshot: string;
  priceSnapshot: string;
  quantity: number;
  sku: string | null;
  imageUrl: string;
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

const sortItems = (
  items: AdminOrderItemRow[],
  sorting: SortingState,
): AdminOrderItemRow[] => {
  const sort = sorting[0];
  if (!sort) return items;
  const dir = sort.desc ? -1 : 1;
  const copy = [...items];
  copy.sort((a, b) => {
    if (sort.id === "quantity") {
      return (a.quantity - b.quantity) * dir;
    }
    if (sort.id === "price") {
      return (Number(a.priceSnapshot) - Number(b.priceSnapshot)) * dir;
    }
    if (sort.id === "total") {
      return (
        (Number(a.priceSnapshot) * a.quantity -
          Number(b.priceSnapshot) * b.quantity) *
        dir
      );
    }
    return a.nameSnapshot.localeCompare(b.nameSnapshot) * dir;
  });
  return copy;
};

const OrderItemsTable = ({ items }: { items: AdminOrderItemRow[] }) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    if (next.length === 0) return;
    setSorting(next);
  };

  const data = useMemo(() => sortItems(items, sorting), [items, sorting]);

  const columns = useMemo<ColumnDef<AdminOrderItemRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "nameSnapshot",
        header: ({ column }) => (
          <SortHeaderButton
            label="Item"
            sorted={column.getIsSorted()}
            onToggle={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="bg-muted size-14 shrink-0 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={row.original.imageUrl}
                alt={row.original.nameSnapshot}
                className="size-full object-cover"
              />
            </div>
            <Link
              href={`/admin/products/${row.original.productId}/edit` as Route}
              className="hover:text-primary font-medium underline-offset-4 hover:underline">
              {row.original.nameSnapshot}
            </Link>
          </div>
        ),
      },
      {
        id: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.sku ?? "-"}
          </span>
        ),
      },
      {
        id: "quantity",
        accessorKey: "quantity",
        header: ({ column }) => (
          <SortHeaderButton
            label="Qty"
            sorted={column.getIsSorted()}
            onToggle={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.quantity}</span>
        ),
      },
      {
        id: "price",
        accessorKey: "priceSnapshot",
        header: ({ column }) => (
          <SortHeaderButton
            label="Price"
            sorted={column.getIsSorted()}
            onToggle={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatPrice(row.original.priceSnapshot)}
          </span>
        ),
      },
      {
        id: "total",
        header: ({ column }) => (
          <SortHeaderButton
            label="Total"
            sorted={column.getIsSorted()}
            onToggle={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatPrice(
              Number(row.original.priceSnapshot) * row.original.quantity,
            )}
          </span>
        ),
      },
    ],
    [],
  );

  const toolbar = (
    <div className="flex items-center justify-between gap-2">
      <p className="text-muted-foreground text-xs tabular-nums">
        {items.length} item{items.length === 1 ? "" : "s"}
      </p>
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      sorting={sorting}
      onSortingChange={handleSortingChange}
      rowSelection={{} as RowSelectionState}
      onRowSelectionChange={() => {}}
      enableRowSelection={false}
      toolbar={toolbar}
      emptyTitle="No items"
      emptyDescription="This order has no line items."
    />
  );
};

export default OrderItemsTable;
