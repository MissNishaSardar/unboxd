import { BanknoteIcon, PackageIcon } from "lucide-react";
import { formatPrice } from "@/lib/format";
import AdminOrdersLoadMore from "@/components/Admin/AdminOrdersLoadMore";
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

const AdminOrdersPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await requireAdminPage();

  const { search, status, date, sort } = adminOrderListSearchParamsSchema.parse(
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
    sort,
    page: 1,
  });

  const hasActiveFilters =
    Boolean(search) || activeStatus !== "all" || Boolean(date);

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

      {orders.length === 0 && !hasActiveFilters ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No orders found</EmptyTitle>
            <EmptyDescription>
              Orders will show up here once customers check out.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      : <AdminOrdersLoadMore
          initialOrders={orders}
          total={total}
          statusCounts={statusCounts}
        />
      }
    </div>
  );
};

export default AdminOrdersPage;
