import Link from "next/link";
import type { Route } from "next";
import { BanknoteIcon, PackageIcon, XIcon } from "lucide-react";
import { formatPrice } from "@/lib/format";
import AdminOrderDateFilter from "@/components/Admin/AdminOrderDateFilter";
import AdminOrderSearch from "@/components/Admin/AdminOrderSearch";
import AdminOrdersLoadMore from "@/components/Admin/AdminOrdersLoadMore";
import { Button } from "@/components/shadcnui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/guard";
import { adminOrderListSearchParamsSchema } from "@/lib/zodSchema";
import { getAdminOrders } from "@/server/admin/orders";

export const metadata: Metadata = {
  title: "Manage Orders",
  description: "Review and fulfill Unboxd orders.",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Placed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "RETURNED", label: "Returned" },
];

const AdminOrdersPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await requireAdminPage();

  const { search, status, date } = adminOrderListSearchParamsSchema.parse(
    await searchParams,
  );
  const activeStatus = status ?? "all";

  // The list uses Load more pagination, so the first render always shows
  // page 1. The ?page= param is only honored by /api/admin/orders for
  // Load more requests.
  const { orders, total, codOutstanding, statusCounts } = await getAdminOrders({
    search,
    status,
    date,
    page: 1,
  });

  const hasActiveFilters =
    Boolean(search) || activeStatus !== "all" || Boolean(date);

  const buildFilterHref = (next: { status?: string; date?: string }) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const nextStatus = next.status ?? activeStatus;
    const nextDate = next.date ?? date;
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextDate) params.set("date", nextDate);
    const query = params.toString();
    return `/admin/orders${query ? `?${query}` : ""}` as Route;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Orders
        </h1>
        <p className="text-muted-foreground text-sm">
          {total} order{total === 1 ? "" : "s"}
        </p>
        {codOutstanding.count > 0 && (
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs tabular-nums">
            <BanknoteIcon
              aria-hidden="true"
              className="size-3.5"
            />
            COD outstanding: {formatPrice(codOutstanding.total)} across{" "}
            {codOutstanding.count} open order
            {codOutstanding.count === 1 ? "" : "s"}
          </p>
        )}
      </div>

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
                render={
                  <Link href={buildFilterHref({ status: option.value })} />
                }
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

      {orders.length === 0 ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No orders found</EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters ?
                "Try adjusting your search or filters."
              : "Orders will show up here once customers check out."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      : <AdminOrdersLoadMore
          initialOrders={orders}
          total={total}
        />
      }
    </div>
  );
};

export default AdminOrdersPage;
