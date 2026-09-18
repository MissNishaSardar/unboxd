import { TrendingUpIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { Separator } from "@/components/shadcnui/separator";
import { formatPrice } from "@/lib/format";
import { getSalesSummary } from "@/server/admin/queries";

const SalesSummaryCard = async () => {
  const summary = await getSalesSummary();
  const hasSales = summary.totalOrders > 0;

  if (!hasSales) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales this week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-1">
            <p className="text-sm font-medium">No sales yet</p>
            <p className="text-muted-foreground text-sm">
              Share your store to get the first order in.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales this week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Orders</span>
            <span className="font-semibold tabular-nums">
              {summary.weekOrders}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Revenue</span>
            <span className="font-semibold tabular-nums">
              {formatPrice(summary.weekRevenue)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              All-time orders
            </span>
            <span className="font-semibold tabular-nums">
              {summary.totalOrders}
            </span>
          </div>
        </div>
        <div className="text-primary mt-3 flex items-center gap-1.5 text-xs [&_svg]:size-3.5">
          <TrendingUpIcon aria-hidden="true" />
          {summary.weekOrders} this week
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesSummaryCard;
