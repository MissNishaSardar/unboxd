import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { formatDate } from "@/lib/format";
import { getDashboardData } from "@/server/dashboard";
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
import QuickActions from "@/components/Dashboard/QuickActions";
import RecentOrders from "@/components/Dashboard/RecentOrders";

const DashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/login");

  const data = await getDashboardData(session.user.id);

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

          {data.activeOrder && <ActiveOrderCard order={data.activeOrder} />}

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

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Quick actions
        </h2>
        <QuickActions isAdmin={session.user.role === "admin"} />
      </section>
    </div>
  );
};

export default DashboardPage;
