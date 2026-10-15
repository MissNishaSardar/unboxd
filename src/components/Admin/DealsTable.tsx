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
import SaleRowActions from "@/components/Admin/SaleRowActions";
import DataTable from "@/components/Admin/DataTable";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { dealStatus } from "@/lib/pricing";
import { formatISTRange } from "@/lib/deals";
import type { FlashSaleData } from "@/server/deals";

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

const statusChip = (sale: {
  discountPercent: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}) => {
  if (!sale.isActive) return <Badge variant="secondary">Paused</Badge>;
  if (sale.discountPercent <= 0) return <Badge variant="outline">Info</Badge>;
  const state = dealStatus({
    discountPercent: sale.discountPercent,
    discountStartsAt: sale.startsAt,
    discountEndsAt: sale.endsAt,
  });
  if (state === "live") return <Badge>Live deal</Badge>;
  if (state === "scheduled") return <Badge variant="outline">Scheduled</Badge>;
  return <Badge variant="secondary">Expired</Badge>;
};

const sortSales = (
  sales: FlashSaleData[],
  sorting: SortingState,
): FlashSaleData[] => {
  const sort = sorting[0];
  if (!sort) return sales;
  const dir = sort.desc ? -1 : 1;
  const copy = [...sales];
  copy.sort((a, b) => {
    if (sort.id === "discount") {
      return (a.discountPercent - b.discountPercent) * dir;
    }
    if (sort.id === "window") {
      const aTime = a.startsAt ? Date.parse(a.startsAt) : 0;
      const bTime = b.startsAt ? Date.parse(b.startsAt) : 0;
      return (aTime - bTime) * dir;
    }
    if (sort.id === "status") {
      const rank = (sale: FlashSaleData) =>
        !sale.isActive ? 0
        : sale.discountPercent <= 0 ? 1
        : (
          dealStatus({
            discountPercent: sale.discountPercent,
            discountStartsAt: sale.startsAt,
            discountEndsAt: sale.endsAt,
          }) === "live"
        ) ?
          3
        : 2;
      return (rank(a) - rank(b)) * dir;
    }
    return a.name.localeCompare(b.name) * dir;
  });
  return copy;
};

const DealsTable = ({ sales }: { sales: FlashSaleData[] }) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "window", desc: true },
  ]);

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    if (next.length === 0) return;
    setSorting(next);
  };

  const data = useMemo(() => sortSales(sales, sorting), [sales, sorting]);

  const columns = useMemo<ColumnDef<FlashSaleData>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <SortHeaderButton
            label="Sale"
            sorted={column.getIsSorted()}
            onToggle={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          />
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              <Link
                href={`/admin/deals/${row.original.id}/edit` as Route}
                className="hover:underline">
                {row.original.name}
              </Link>
            </p>
            {row.original.bannerText !== "" && (
              <p className="text-muted-foreground truncate text-xs">
                Banner on
              </p>
            )}
          </div>
        ),
      },
      {
        id: "discount",
        accessorKey: "discountPercent",
        header: ({ column }) => (
          <SortHeaderButton
            label="Discount"
            sorted={column.getIsSorted()}
            onToggle={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.discountPercent > 0 ?
              `${row.original.discountPercent}% off`
            : "Info only"}
          </span>
        ),
      },
      {
        id: "window",
        header: ({ column }) => (
          <SortHeaderButton
            label="Window"
            sorted={column.getIsSorted()}
            onToggle={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          />
        ),
        cell: ({ row }) => (
          <span className="text-xs">
            {formatISTRange(row.original.startsAt, row.original.endsAt) ||
              "Always on"}
          </span>
        ),
      },
      {
        id: "status",
        header: ({ column }) => (
          <SortHeaderButton
            label="Status"
            sorted={column.getIsSorted()}
            onToggle={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          />
        ),
        cell: ({ row }) => statusChip(row.original),
      },
      {
        id: "actions",
        header: () => <span className="flex justify-end">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <SaleRowActions
              id={row.original.id}
              name={row.original.name}
            />
          </div>
        ),
      },
    ],
    [],
  );

  const toolbar = (
    <div className="flex items-center justify-between gap-2">
      <p className="text-muted-foreground text-xs tabular-nums">
        {sales.length} sale{sales.length === 1 ? "" : "s"}
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
      emptyTitle="No sales yet"
      emptyDescription="Create one for the next festival rush."
      minWidthClass="min-w-[720px]"
    />
  );
};

export default DealsTable;
