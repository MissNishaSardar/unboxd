"use client";

import Link from "next/link";
import type { Route } from "next";
import { useSearchParams } from "next/navigation";
import { XIcon } from "lucide-react";
import AdminOrderDateFilter from "@/components/Admin/AdminOrderDateFilter";
import AdminOrderSearch from "@/components/Admin/AdminOrderSearch";
import { Button } from "@/components/shadcnui/button";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Placed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "RETURNED", label: "Returned" },
];

const OrdersFilters = ({
  total,
  statusCounts,
}: {
  total: number;
  statusCounts: Record<string, number>;
}) => {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const activeStatus = searchParams.get("status") ?? "all";
  const date = searchParams.get("date") ?? "";
  const sort = searchParams.get("sort") ?? "date_desc";

  const hasActiveFilters =
    Boolean(search) || activeStatus !== "all" || Boolean(date);

  const buildFilterHref = (next: { status?: string }) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (date) params.set("date", date);
    if (sort !== "date_desc") params.set("sort", sort);
    const nextStatus = next.status ?? activeStatus;
    if (nextStatus !== "all") params.set("status", nextStatus);
    const query = params.toString();
    return `/admin/orders${query ? `?${query}` : ""}` as Route;
  };

  return (
    <div className="flex flex-col gap-3">
      <AdminOrderSearch />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div
          role="group"
          aria-label="Filter by status"
          className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            Status:
          </span>
          {STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              render={<Link href={buildFilterHref({ status: option.value })} />}
              nativeButton={false}
              variant={activeStatus === option.value ? "default" : "outline"}
              size="sm">
              {option.label}
              <span className="tabular-nums opacity-70">
                {option.value === "all" ?
                  total
                : (statusCounts[option.value] ?? 0)}
              </span>
            </Button>
          ))}
        </div>
        <div
          role="group"
          aria-label="Filter by date"
          className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            Date:
          </span>
          <AdminOrderDateFilter />
        </div>
        {hasActiveFilters && (
          <Button
            render={<Link href="/admin/orders" />}
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
        Status filters by order status. Date filters by the day the order was
        placed.
      </p>
    </div>
  );
};

export default OrdersFilters;
