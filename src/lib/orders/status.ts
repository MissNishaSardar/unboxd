import type { LucideIcon } from "lucide-react";
import { DAY_MS } from "@/lib/constants";
import {
  CheckCircle2Icon,
  ClockIcon,
  PackageIcon,
  RotateCcwIcon,
  TruckIcon,
  XCircleIcon,
} from "lucide-react";

export const ORDER_STATUS_FLOW = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
] as const;

export type OrderStatus =
  (typeof ORDER_STATUS_FLOW)[number] | "CANCELLED" | "RETURNED";

export const COD_DELIVERY_DAYS = 5;

type StatusConfig = {
  label: string;
  badgeVariant: "default" | "secondary" | "destructive";
  badgeClass?: string;
  icon: LucideIcon;
};

export const orderStatusConfig: Record<OrderStatus, StatusConfig> = {
  PENDING: {
    label: "Placed",
    badgeVariant: "secondary",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    icon: ClockIcon,
  },
  CONFIRMED: {
    label: "Confirmed",
    badgeVariant: "secondary",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    icon: PackageIcon,
  },
  SHIPPED: {
    label: "Shipped",
    badgeVariant: "secondary",
    badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    icon: TruckIcon,
  },
  DELIVERED: {
    label: "Delivered",
    badgeVariant: "default",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2Icon,
  },
  CANCELLED: {
    label: "Cancelled",
    badgeVariant: "destructive",
    icon: XCircleIcon,
  },
  RETURNED: {
    label: "Returned",
    badgeVariant: "destructive",
    icon: RotateCcwIcon,
  },
};

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export function canTransition(from: string, to: string): boolean {
  if (!isOrderStatus(from) || !isOrderStatus(to)) return false;
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function isTerminalStatus(status: string): boolean {
  return status === "CANCELLED" || status === "RETURNED";
}

export function getNextStatus(status: string): OrderStatus | null {
  if (!isOrderStatus(status)) return null;
  const flowIndex = ORDER_STATUS_FLOW.indexOf(
    status as (typeof ORDER_STATUS_FLOW)[number],
  );
  if (flowIndex >= 0 && flowIndex < ORDER_STATUS_FLOW.length - 1) {
    return ORDER_STATUS_FLOW[flowIndex + 1];
  }
  return null;
}

export function isOrderStatus(value: string): value is OrderStatus {
  return value in orderStatusConfig;
}

export function getOrderStatusConfig(status: string): StatusConfig {
  return isOrderStatus(status) ?
      orderStatusConfig[status]
    : { label: status, badgeVariant: "secondary", icon: PackageIcon };
}

export function getEstimatedDelivery(
  createdAt: Date,
  deliveryDays: number = COD_DELIVERY_DAYS,
): Date {
  const eta = new Date(createdAt);
  eta.setDate(eta.getDate() + deliveryDays);
  return eta;
}

export function isWithinReturnWindow(
  deliveredAt: Date,
  returnWindowDays: number,
  now: Date = new Date(),
): boolean {
  return now.getTime() - deliveredAt.getTime() <= returnWindowDays * DAY_MS;
}
