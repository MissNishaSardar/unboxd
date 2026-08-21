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
import { getDashboardData } from "@/server/dashboard";

type ActiveOrderCardProps = {
  order: NonNullable<
    Awaited<ReturnType<typeof getDashboardData>>["activeOrder"]
  >;
};

const ActiveOrderCard = ({ order }: ActiveOrderCardProps) => {
  const showEta = order.status === "CONFIRMED" || order.status === "SHIPPED";
  const eta = getEstimatedDelivery(order.createdAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <PackageIcon
              aria-hidden="true"
              className="text-muted-foreground size-4"
            />
            Order in progress
          </span>
          <OrderStatusBadge status={order.status} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <OrderTimeline status={order.status} />
        {showEta && (
          <div className="flex items-center gap-2 border-t pt-3">
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
