import { PackageIcon } from "lucide-react";
import OrderFilters from "@/components/Admin/OrderFilters";
import OrdersTable from "@/components/Admin/OrdersTable";
import Pagination from "@/components/Product/Pagination";
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

  const {
    search,
    status,
    date,
    page = 1,
  } = adminOrderListSearchParamsSchema.parse(await searchParams);

  const { orders, total, totalPages } = await getAdminOrders({
    search,
    status,
    date,
    page,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Orders
        </h1>
        <p className="text-muted-foreground text-sm">
          {total} order{total === 1 ? "" : "s"}
        </p>
      </div>

      <OrderFilters />

      {orders.length === 0 ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No orders found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search or filters.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      : <OrdersTable orders={orders} />}

      {orders.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pathname="/admin/orders"
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;
