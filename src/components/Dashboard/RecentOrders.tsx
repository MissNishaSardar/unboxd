import { getDashboardData } from "@/server/dashboard";
import OrderRowCard from "@/components/Orders/OrderRowCard";

type RecentOrdersProps = {
  orders: Awaited<ReturnType<typeof getDashboardData>>["recentOrders"];
};

const RecentOrders = ({ orders }: RecentOrdersProps) => {
  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => (
        <OrderRowCard
          key={order.id}
          order={{
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            total: String(order.total),
            createdAt: order.createdAt.toISOString(),
            items: order.items.map((item) => ({
              quantity: item.quantity,
            })),
            previews: order.previews,
          }}
        />
      ))}
    </ul>
  );
};

export default RecentOrders;
