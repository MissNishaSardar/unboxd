import { TrendingUpIcon } from "lucide-react";
import AdminEmptyState from "@/components/Admin/AdminEmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { Separator } from "@/components/shadcnui/separator";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getSalesSummary } from "@/server/admin/queries";

const SalesSummaryCard = async ({ className }: { className?: string }) => {
  const summary = await getSalesSummary();
  const hasSales = summary.totalOrders > 0;

  if (!hasSales) {
    return (
      <Card className={cn("flex h-full flex-col", className)}>
        <CardHeader>
          <CardTitle>Sales this week</CardTitle>
          <CardDescription>Orders and revenue since Monday</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <AdminEmptyState
            title="No sales yet"
            message="Share your store to get the first order in."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader>
        <CardTitle>Sales this week</CardTitle>
        <CardDescription>Orders and revenue since Monday</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
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
        <div className="text-primary mt-auto flex items-center gap-1.5 pt-3 text-xs [&_svg]:size-3.5">
          <TrendingUpIcon aria-hidden="true" />
          {summary.weekOrders} this week
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesSummaryCard;
