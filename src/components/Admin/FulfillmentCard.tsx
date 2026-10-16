import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { cn } from "@/lib/utils";
import { getAdminAttention } from "@/server/admin/queries";

const FulfillmentCard = async ({ className }: { className?: string }) => {
  const attention = await getAdminAttention();

  const rows = [
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
      label: "returns to review",
      href: "/admin/orders?status=RETURNED" as Route,
    },
    {
      count: attention.lowStock,
      label: "low stock products",
      href: "/admin/products?stock=low" as Route,
    },
  ];

  const allClear = rows.every((row) => row.count === 0);
  const visibleRows = rows.filter((row) => row.count > 0);

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader>
        <CardTitle>Pending fulfillment</CardTitle>
        <CardDescription>Orders and stock needing action</CardDescription>
        {!allClear && (
          <CardAction>
            <Button
              render={<Link href={"/admin/orders" as Route} />}
              nativeButton={false}
              variant="outline"
              size="sm">
              Fulfill
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {allClear ?
          <div className="flex flex-col items-start gap-1 py-1">
            <p className="text-sm font-medium">All caught up</p>
            <p className="text-muted-foreground text-sm">
              No orders are waiting for shipment and no products are running
              low. New work will show up here automatically.
            </p>
          </div>
        : <ul className="flex flex-col gap-2">
            {visibleRows.map((row) => (
              <li
                key={row.label}
                className="bg-muted/60 flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs">
                <span>
                  <span className="font-semibold tabular-nums">
                    {row.count}
                  </span>{" "}
                  {row.label}
                </span>
                <Link
                  href={row.href}
                  aria-label={`View ${row.count} ${row.label}`}
                  className="text-primary font-medium underline-offset-4 hover:underline">
                  View
                </Link>
              </li>
            ))}
          </ul>
        }
      </CardContent>
    </Card>
  );
};

export default FulfillmentCard;
