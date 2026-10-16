import AdminEmptyState from "@/components/Admin/AdminEmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { formatDayMonth, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getRevenueTrend } from "@/server/admin/queries";

const RevenueTrendCard = async ({ className }: { className?: string }) => {
  const trend = await getRevenueTrend(14);
  const maxRevenue = Math.max(
    0,
    ...trend.days.map((day) => Number(day.revenue)),
  );
  const hasRevenue = trend.totalOrders > 0;
  const range =
    trend.days.length > 0 ?
      `${formatDayMonth(`${trend.days[0].date}T00:00:00`)} to ${formatDayMonth(`${trend.days[trend.days.length - 1].date}T00:00:00`)}`
    : null;

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader>
        <CardTitle>Revenue trend</CardTitle>
        <CardDescription>
          {range ?
            `Daily totals for ${range}, last 14 days`
          : "Daily totals for the last 14 days"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {!hasRevenue ?
          <AdminEmptyState
            title="No revenue yet"
            message="Daily totals will chart here once orders arrive. Share your store to get the first order in."
          />
        : <>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-muted-foreground text-xs">14-day revenue</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatPrice(trend.totalRevenue)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">14-day orders</p>
                <p className="text-lg font-semibold tabular-nums">
                  {trend.totalOrders}
                </p>
              </div>
            </div>
            <div
              className="flex h-28 items-end gap-1.5"
              role="img"
              aria-label={`Revenue over the last 14 days, total ${formatPrice(trend.totalRevenue)}`}>
              {trend.days.map((day) => {
                const value = Number(day.revenue);
                const height =
                  maxRevenue > 0 ? Math.max(6, (value / maxRevenue) * 100) : 6;
                return (
                  <div
                    key={day.date}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <div
                      title={`${day.label}: ${day.orders} orders, ${formatPrice(day.revenue)}`}
                      className={cn(
                        "w-full rounded-sm",
                        value > 0 ? "bg-primary" : "bg-muted",
                      )}
                      style={{ height: `${(height / 100) * 112}px` }}
                    />
                    <span className="text-muted-foreground text-[10px] tabular-nums">
                      {day.label.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        }
      </CardContent>
    </Card>
  );
};

export default RevenueTrendCard;
