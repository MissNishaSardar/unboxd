import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageIcon } from "lucide-react";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Unboxd overview. Orders, activity, and recommendations.",
};
import { headers } from "next/headers";
import { formatDate } from "@/lib/format";
import { getDashboardData } from "@/server/dashboard";
import { getStoreSettings } from "@/server/admin/settings";
import { Button } from "@/components/shadcnui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import ActiveOrderCard from "@/components/Dashboard/ActiveOrderCard";
import DashboardStats from "@/components/Dashboard/DashboardStats";
import ProductRail from "@/components/Dashboard/ProductRail";
import RecentlyViewedRail from "@/components/Dashboard/RecentlyViewedRail";
import RecentOrders from "@/components/Dashboard/RecentOrders";

const DashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/login");

  const [data, settings] = await Promise.all([
    getDashboardData(session.user.id),
    getStoreSettings(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Hi {session.user.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          Member since {formatDate(session.user.createdAt)}
        </p>
      </div>

      {data.orderCount === 0 ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No orders yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t placed any orders yet. Browse the catalog and
              place your first order.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              render={<Link href="/products" />}
              nativeButton={false}>
              Browse products
            </Button>
          </EmptyContent>
        </Empty>
      : <>
          <DashboardStats
            orderCount={data.orderCount}
            activeCount={data.activeCount}
            totalSpent={data.totalSpent}
          />

          {data.activeOrder && (
            <ActiveOrderCard
              order={data.activeOrder}
              deliveryDays={settings.deliveryDays}
            />
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Recent orders
              </h2>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/orders" />}
                nativeButton={false}>
                View all
              </Button>
            </div>
            <RecentOrders orders={data.recentOrders} />
          </section>
        </>
      }

      <RecentlyViewedRail />

      {data.wishlistProducts.length > 0 && (
        <ProductRail
          title="From your wishlist"
          href="/wishlist"
          products={data.wishlistProducts}
        />
      )}

      {data.topRated.length > 0 && (
        <ProductRail
          title="Recommended for you"
          products={data.topRated}
          cardClass="w-44"
          compact
        />
      )}
    </div>
  );
};

export default DashboardPage;
