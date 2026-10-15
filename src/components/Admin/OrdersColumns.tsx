"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  EyeIcon,
} from "lucide-react";
import type { AdminOrderRow } from "@/server/admin/orders";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Checkbox } from "@/components/shadcnui/checkbox";
import { formatDate, formatPrice } from "@/lib/format";
import { CANCEL_REASON_LABELS } from "@/lib/zodSchema";
import OrderStatusBadge from "@/components/Orders/OrderStatusBadge";

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

export const getOrdersColumns = (): ColumnDef<AdminOrderRow>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) =>
          table.toggleAllPageRowsSelected(checked === true)
        }
        aria-label="Select all orders"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        indeterminate={false}
        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
        disabled={!row.getCanSelect()}
        aria-label={`Select order ${row.original.id}`}
      />
    ),
    enableSorting: false,
  },
  {
    id: "order",
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <p
        className="truncate text-sm font-medium"
        title={row.original.id}>
        #{row.original.orderNumber}
      </p>
    ),
    enableSorting: false,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortHeaderButton
        label="Date"
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
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {row.original.customerName}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {row.original.customerEmail}
        </p>
      </div>
    ),
    enableSorting: false,
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {row.original.thumbnails.map((src) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={src}
              src={src}
              alt=""
              aria-hidden="true"
              className="border-background size-7 rounded-full border-2 object-cover"
            />
          ))}
        </div>
        <span className="tabular-nums">{row.original.itemCount}</span>
      </div>
    ),
    enableSorting: false,
  },
  {
    id: "total",
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <span className="tabular-nums">{formatPrice(row.original.total)}</span>
    ),
    enableSorting: false,
  },
  {
    id: "payment",
    header: "Payment",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.paymentMethod}</Badge>
    ),
    enableSorting: false,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
    enableSorting: false,
  },
  {
    id: "cancelReason",
    header: "Cancel reason",
    cell: ({ row }) => (
      <span className="max-w-44 truncate text-xs">
        {row.original.status === "CANCELLED" ?
          (
            row.original.cancelReason != null &&
            row.original.cancelReason in CANCEL_REASON_LABELS
          ) ?
            CANCEL_REASON_LABELS[
              row.original.cancelReason as keyof typeof CANCEL_REASON_LABELS
            ]
          : "No reason given"
        : <span className="text-muted-foreground">-</span>}
      </span>
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    header: () => <span className="flex justify-end">Actions</span>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end">
        <Button
          render={<Link href={`/admin/orders/${row.original.id}` as Route} />}
          nativeButton={false}
          variant="ghost"
          size="icon-sm"
          aria-label={`View order ${row.original.id}`}>
          <EyeIcon aria-hidden="true" />
        </Button>
      </div>
    ),
    enableSorting: false,
  },
];
