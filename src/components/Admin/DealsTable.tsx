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
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  MegaphoneIcon,
  TriangleAlertIcon,
} from "lucide-react";
import SaleRowActions from "@/components/Admin/SaleRowActions";
import DataTable from "@/components/Admin/DataTable";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { dealStatus } from "@/lib/pricing";
import { formatISTRange, saleWindowsOverlap } from "@/lib/deals";
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

type SaleStatusFilter =
  "all" | "active" | "scheduled" | "paused" | "ended" | "info";

const FILTER_OPTIONS: { value: SaleStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "paused", label: "Paused" },
  { value: "ended", label: "Ended" },
  { value: "info", label: "Info" },
];

const getFilterKey = (
  sale: FlashSaleData,
): Exclude<SaleStatusFilter, "all"> => {
  if (!sale.isActive) return "paused";
  if (sale.discountPercent <= 0) return "info";
  const state = dealStatus({
    discountPercent: sale.discountPercent,
    discountStartsAt: sale.startsAt,
    discountEndsAt: sale.endsAt,
  });
  if (state === "live") return "active";
  if (state === "scheduled") return "scheduled";
  return "ended";
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
  const [statusFilter, setStatusFilter] = useState<SaleStatusFilter>("all");

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    if (next.length === 0) return;
    setSorting(next);
  };

  const counts = useMemo(() => {
    const result: Record<SaleStatusFilter, number> = {
      all: sales.length,
      active: 0,
      scheduled: 0,
      paused: 0,
      ended: 0,
      info: 0,
    };
    for (const sale of sales) {
      result[getFilterKey(sale)] += 1;
    }
    return result;
  }, [sales]);

  const conflicts = useMemo(() => {
    const result = new Map<string, FlashSaleData[]>();
    const discountSales = sales.filter((sale) => sale.discountPercent > 0);
    for (const sale of discountSales) {
      const rivals = discountSales.filter(
        (other) =>
          other.id !== sale.id &&
          other.isActive &&
          saleWindowsOverlap(sale, other),
      );
      if (rivals.length > 0) result.set(sale.id, rivals);
    }
    return result;
  }, [sales]);

  const data = useMemo(() => {
    const filtered =
      statusFilter === "all" ? sales : (
        sales.filter((sale) => getFilterKey(sale) === statusFilter)
      );
    return sortSales(filtered, sorting);
  }, [sales, sorting, statusFilter]);

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
        cell: ({ row }) => {
          const sale = row.original;
          const hasBanner = sale.bannerText.trim() !== "";
          return (
            <div className="flex min-w-0 flex-col items-start gap-1">
              <p className="truncate text-sm font-medium">
                <Link
                  href={`/admin/deals/${sale.id}/edit` as Route}
                  className="hover:underline">
                  {sale.name}
                </Link>
              </p>
              {hasBanner && (
                <Badge
                  variant={sale.bannerEnabled ? "outline" : "secondary"}
                  title={sale.bannerText}>
                  <MegaphoneIcon
                    data-icon="inline-start"
                    aria-hidden="true"
                  />
                  {sale.bannerEnabled ? "Banner on" : "Banner off"}
                </Badge>
              )}
            </div>
          );
        },
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
        cell: ({ row }) => {
          const sale = row.original;
          const rivals = conflicts.get(sale.id) ?? [];
          return (
            <span className="inline-flex items-center gap-1.5">
              {statusChip(sale)}
              {rivals.length > 0 && (
                <span
                  title={
                    sale.isActive ?
                      `Overlaps ${rivals.map((rival) => rival.name).join(", ")}. Only one discount sale can cover a window.`
                    : `Would overlap ${rivals.map((rival) => rival.name).join(", ")} if enabled.`
                  }
                  aria-label={
                    sale.isActive ?
                      `Overlaps ${rivals.map((rival) => rival.name).join(", ")}`
                    : `Would overlap ${rivals.map((rival) => rival.name).join(", ")} if enabled`
                  }
                  role="img">
                  <TriangleAlertIcon
                    aria-hidden="true"
                    className={
                      sale.isActive ?
                        "text-destructive size-4"
                      : "text-muted-foreground size-4"
                    }
                  />
                </span>
              )}
            </span>
          );
        },
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
    [conflicts],
  );

  const toolbar = (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-label="Filter by status"
        className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground text-xs font-medium">
          Status:
        </span>
        {FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={statusFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(option.value)}
            aria-pressed={statusFilter === option.value}>
            {option.label}
            <span className="tabular-nums opacity-70">
              {counts[option.value]}
            </span>
          </Button>
        ))}
      </div>
      <p className="text-muted-foreground text-xs tabular-nums">
        {statusFilter === "all" ?
          `${sales.length} sale${sales.length === 1 ? "" : "s"}`
        : `${data.length} of ${sales.length} sale${sales.length === 1 ? "" : "s"}`
        }
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
      emptyTitle={
        statusFilter === "all" ? "No sales yet" : "No sales match this filter"
      }
      emptyDescription={
        statusFilter === "all" ?
          "Create one for the next festival rush."
        : "Try a different status filter."
      }
      minWidthClass="min-w-[720px]"
    />
  );
};

export default DealsTable;
