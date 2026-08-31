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
