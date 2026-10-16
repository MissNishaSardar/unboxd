import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/guard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Unboxd admin overview. Manage products, orders, and users.",
};
import ExpiringDealsCard from "@/components/Admin/ExpiringDealsCard";
import FulfillmentCard from "@/components/Admin/FulfillmentCard";
import RecentOrdersCard from "@/components/Admin/RecentOrdersCard";
import RevenueTrendCard from "@/components/Admin/RevenueTrendCard";
import SalesSummaryCard from "@/components/Admin/SalesSummaryCard";
import TopProductsCard from "@/components/Admin/TopProductsCard";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { getAdminAttention, getAdminTotals } from "@/server/admin/queries";

const SECTIONS = [
  {
    title: "Products",
    description: "Manage catalog, variants, stock",
    href: "/admin/products" as const,
    emptyTitle: "No products yet",
    emptyMessage: "Add your first product to start selling.",
  },
  {
    title: "Orders",
    description: "Fulfill orders and update statuses",
    href: "/admin/orders" as const,
    emptyTitle: "No orders yet",
    emptyMessage: "Orders will appear here once customers check out.",
  },
  {
    title: "Categories",
    description: "Manage the category tree",
    href: "/admin/categories" as const,
    emptyTitle: "No categories yet",
    emptyMessage: "Create categories to organize your catalog.",
  },
  {
    title: "Users",
    description: "Roles, bans, impersonation",
    href: "/admin/users" as const,
    emptyTitle: "No users yet",
    emptyMessage: "New signups will show up here automatically.",
  },
];

const AdminPage = async () => {
  await requireAdminPage();
  const [attention, totals] = await Promise.all([
    getAdminAttention(),
    getAdminTotals(),
  ]);

  const countBySection: Record<string, { count: number; label: string }> = {
    Orders: {
      count: totals.totalOrders,
      label: `order${totals.totalOrders === 1 ? "" : "s"}`,
    },
    Products: {
      count: totals.totalProducts,
      label: `product${totals.totalProducts === 1 ? "" : "s"}`,
    },
    Categories: {
      count: totals.totalCategories,
      label: `categor${totals.totalCategories === 1 ? "y" : "ies"}`,
    },
    Users: {
      count: totals.totalUsers,
      label: `user${totals.totalUsers === 1 ? "" : "s"}`,
    },
  };

  type SectionAlert = { count: number; label: string; href: Route };
  const alertsBySection: Record<string, SectionAlert[]> = {
    Orders: [
      ...(attention.awaitingShipment > 0 ?
        [
          {
            count: attention.awaitingShipment,
            label: "awaiting shipment",
            href: "/admin/orders?status=CONFIRMED" as Route,
          },
        ]
      : []),
      ...(attention.inTransit > 0 ?
        [
          {
            count: attention.inTransit,
            label: "in transit",
            href: "/admin/orders?status=SHIPPED" as Route,
          },
        ]
      : []),
      ...(attention.returned > 0 ?
        [
          {
            count: attention.returned,
            label: "returned",
            href: "/admin/orders?status=RETURNED" as Route,
          },
        ]
      : []),
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Track fulfillment, sales, and deals at a glance.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map((section) => {
          const summary = countBySection[section.title];
          const alerts = alertsBySection[section.title] ?? [];
          const isEmpty = summary.count === 0;
          return (
            <Card
              key={section.title}
              className="flex h-full flex-col">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
                {section.href && (
                  <CardAction>
                    <Button
                      render={<Link href={section.href} />}
                      nativeButton={false}
                      variant="outline"
                      size="sm">
                      Manage
                    </Button>
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2">
                <div className="flex min-h-[36px] flex-col gap-2">
                  {alerts.length > 0 ?
                    alerts.map((alert) => (
                      <p
                        key={alert.label}
                        className="flex items-center justify-between gap-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs">
                        <span className="text-amber-700 dark:text-amber-400">
                          <span className="font-semibold tabular-nums">
                            {alert.count}
                          </span>{" "}
                          {alert.label}
                        </span>
                        <Link
                          href={alert.href}
                          aria-label={`View ${alert.count} ${alert.label}`}
                          className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-400">
                          View
                        </Link>
                      </p>
                    ))
                  : <p
                      aria-hidden="true"
                      className="invisible rounded-lg px-2.5 py-1.5 text-xs select-none">
                      No alerts
                    </p>
                  }
                </div>
                <div className="mt-auto">
                  {isEmpty ?
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium">
                        {section.emptyTitle}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {section.emptyMessage}
                      </p>
                    </div>
                  : <p className="text-sm font-medium tabular-nums">
                      {summary.count} {summary.label}
                    </p>
                  }
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SalesSummaryCard />
        <FulfillmentCard />
        <ExpiringDealsCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <RecentOrdersCard className="lg:col-span-7" />
        <TopProductsCard className="lg:col-span-5" />
      </div>

      <RevenueTrendCard />
    </div>
  );
};

export default AdminPage;
