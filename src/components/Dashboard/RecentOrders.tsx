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
            ...order,
            total: String(order.total),
            createdAt: order.createdAt.toISOString(),
          }}
        />
      ))}
    </ul>
  );
};

export default RecentOrders;
