import { Badge } from "@/components/shadcnui/badge";
import { getOrderStatusConfig } from "@/lib/orders/status";
import { cn } from "@/lib/utils";

const OrderStatusBadge = ({ status }: { status: string }) => {
  const config = getOrderStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge
      variant={config.badgeVariant}
      className={cn(config.badgeClass)}>
      <Icon aria-hidden="true" />
      {config.label}
    </Badge>
  );
};

export default OrderStatusBadge;
