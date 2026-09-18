import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

export type AdminAttention = {
  awaitingShipment: number;
  inTransit: number;
  returned: number;
  deliveredEligible: number;
  lowStock: number;
};

const AttentionQueue = ({ attention }: { attention: AdminAttention }) => {
  const actionable = [
    {
      count: attention.awaitingShipment,
      label: "awaiting shipment",
      href: "/admin/orders?status=CONFIRMED" as Route,
    },
    {
      count: attention.inTransit,
      label: "in transit",
      href: "/admin/orders?status=SHIPPED" as Route,
    },
    {
      count: attention.returned,
      label: "returned",
      href: "/admin/orders?status=RETURNED" as Route,
    },
    {
      count: attention.lowStock,
      label: "low stock products",
      href: "/admin/products?stock=low" as Route,
    },
  ];

  const total = actionable.reduce((sum, item) => sum + item.count, 0);
  const visible = actionable.filter((item) => item.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs your attention</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {total === 0 ?
          <p className="text-muted-foreground text-sm">
            All clear. Nothing needs action.
          </p>
        : <ul className="flex flex-col divide-y">
            {visible.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-3 py-2.5">
                <p className="text-sm">
                  <span className="font-semibold tabular-nums">
                    {item.count}
                  </span>{" "}
                  <span className="text-muted-foreground">{item.label}</span>
                </p>
                <Button
                  render={<Link href={item.href} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm">
                  View
                </Button>
              </li>
            ))}
          </ul>
        }
        {attention.deliveredEligible > 0 && (
          <p className="text-muted-foreground flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="text-foreground font-semibold tabular-nums">
                {attention.deliveredEligible}
              </span>{" "}
              delivered and return eligible
            </span>
            <Button
              render={<Link href={"/admin/orders?status=DELIVERED" as Route} />}
              nativeButton={false}
              variant="ghost"
              size="sm">
              View
            </Button>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AttentionQueue;
