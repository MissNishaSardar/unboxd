import type { Route } from "next";
import Link from "next/link";
import AdminEmptyState from "@/components/Admin/AdminEmptyState";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { formatDate, formatEndsIn } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getExpiringDeals } from "@/server/admin/queries";

const ExpiringDealsCard = async ({ className }: { className?: string }) => {
  const now = new Date();
  const { productDeals, flashSales } = await getExpiringDeals(5);
  const isEmpty = productDeals.length === 0 && flashSales.length === 0;

  const endsLabel = (endsAt: string | null) =>
    formatEndsIn(endsAt, now) ??
    (endsAt ? `Ends ${formatDate(endsAt)}` : "Ending soon");

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader>
        <CardTitle>Expiring deals</CardTitle>
        <CardDescription>Discounts ending soonest</CardDescription>
        <CardAction>
          <Button
            render={<Link href={"/admin/deals" as Route} />}
            nativeButton={false}
            variant="outline"
            size="sm">
            View deals
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {isEmpty ?
          <AdminEmptyState
            title="No expiring deals"
            message="Timed discounts will show up here before they end. Create a deal to drive the next sales spike."
            actionHref={"/admin/deals" as Route}
            actionLabel="View deals"
          />
        : <ul className="divide-border flex flex-col divide-y">
            {flashSales.map((sale) => (
              <li
                key={sale.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <Link
                    href={"/admin/deals" as Route}
                    className="block truncate text-sm font-medium underline-offset-4 hover:underline">
                    {sale.name}
                  </Link>
                  <p
                    className="text-muted-foreground text-xs"
                    title={sale.endsAt ? formatDate(sale.endsAt) : undefined}>
                    {endsLabel(sale.endsAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 tabular-nums dark:text-amber-400">
                  {sale.discountPercent}% off
                </span>
              </li>
            ))}
            {productDeals.map((deal) => (
              <li
                key={deal.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/products/${deal.id}/edit` as Route}
                    className="block truncate text-sm font-medium underline-offset-4 hover:underline">
                    {deal.name}
                  </Link>
                  <p
                    className="text-muted-foreground text-xs"
                    title={deal.endsAt ? formatDate(deal.endsAt) : undefined}>
                    {endsLabel(deal.endsAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 tabular-nums dark:text-amber-400">
                  {deal.discountPercent}% off
                </span>
              </li>
            ))}
          </ul>
        }
      </CardContent>
    </Card>
  );
};

export default ExpiringDealsCard;
