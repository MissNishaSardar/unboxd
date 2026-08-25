import Link from "next/link";
import { PackageIcon, ShoppingBagIcon, WalletIcon } from "lucide-react";
import { Card, CardContent } from "@/components/shadcnui/card";
import { formatPrice } from "@/lib/format";

type DashboardStatsProps = {
  orderCount: number;
  activeCount: number;
  totalSpent: string;
};

const STATS = [
  { key: "orders", label: "Total orders", icon: ShoppingBagIcon },
  { key: "active", label: "Active orders", icon: PackageIcon },
  { key: "spent", label: "Total spent", icon: WalletIcon },
] as const;

const DashboardStats = ({
  orderCount,
  activeCount,
  totalSpent,
}: DashboardStatsProps) => {
  const values = {
    orders: orderCount,
    active: activeCount,
    spent: formatPrice(totalSpent),
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link
            key={stat.key}
            href="/orders"
            className="transition-opacity hover:opacity-80">
            <Card className="border-border bg-card">
              <CardContent className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {values[stat.key]}
                  </p>
                </div>
                <Icon
                  aria-hidden="true"
                  className="text-muted-foreground size-5"
                />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default DashboardStats;
