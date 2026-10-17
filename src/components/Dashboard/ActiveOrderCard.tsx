import Link from "next/link";
import { CalendarClockIcon, PackageIcon } from "lucide-react";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import OrderStatusBadge from "@/components/Orders/OrderStatusBadge";
import OrderTimeline from "@/components/Orders/OrderTimeline";
import { formatDate } from "@/lib/format";
import { getEstimatedDelivery } from "@/lib/orders/status";
import { getOrdersHomeData } from "@/server/orders-home";

type ActiveOrderCardProps = {
  order: NonNullable<
    Awaited<ReturnType<typeof getOrdersHomeData>>["activeOrder"]
  >;
  deliveryDays?: number;
};

const ActiveOrderCard = ({ order, deliveryDays }: ActiveOrderCardProps) => {
  const showEta = order.status === "CONFIRMED" || order.status === "SHIPPED";
  const eta = getEstimatedDelivery(order.createdAt, deliveryDays);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <PackageIcon
              aria-hidden="true"
              className="text-muted-foreground size-4"
            />
            <span title={order.id}>
              Order in progress · #{order.orderNumber}
            </span>
          </span>
          <OrderStatusBadge status={order.status} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <OrderTimeline status={order.status} />
        {showEta && (
          <div className="border-border flex items-center gap-2 border-t pt-3">
            <CalendarClockIcon
              aria-hidden="true"
              className="text-muted-foreground size-4"
            />
            <p className="text-sm">
              Estimated delivery by{" "}
              <span className="font-medium">{formatDate(eta)}</span>
            </p>
          </div>
        )}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/orders/${order.id}`} />}
            nativeButton={false}>
            View order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveOrderCard;
