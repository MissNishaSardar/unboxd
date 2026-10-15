import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAdminPage } from "@/lib/guard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Unboxd admin overview. Manage products, orders, and users.",
};
import SalesSummaryCard from "@/components/Admin/SalesSummaryCard";
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
  },
  {
    title: "Orders",
    description: "Fulfill orders and update statuses",
    href: "/admin/orders" as const,
  },
  {
    title: "Categories",
    description: "Manage the category tree",
    href: "/admin/categories" as const,
  },
  {
    title: "Users",
    description: "Roles, bans, impersonation",
    href: "/admin/users" as const,
  },
];

const AdminPage = async () => {
  await requireAdminPage();
  const [session, attention, totals] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getAdminAttention(),
    getAdminTotals(),
  ]);

  const countBySection: Record<string, string> = {
    Orders: `${totals.totalOrders} order${totals.totalOrders === 1 ? "" : "s"}`,
    Products: `${totals.totalProducts} product${totals.totalProducts === 1 ? "" : "s"}`,
    Categories: `${totals.totalCategories} categor${totals.totalCategories === 1 ? "y" : "ies"}`,
    Users: `${totals.totalUsers} user${totals.totalUsers === 1 ? "" : "s"}`,
  };

  type SectionAlert = { count: number; label: string; href: Route };
  const alertsBySection: Record<string, SectionAlert[]> = {
    Products:
      attention.lowStock > 0 ?
        [
          {
            count: attention.lowStock,
            label: "low stock",
            href: "/admin/products?stock=low" as Route,
          },
        ]
      : [],
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
          Signed in as {session?.user.email} ({session?.user.role})
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
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
            {countBySection[section.title] && (
              <CardContent className="flex flex-col gap-2">
                {(alertsBySection[section.title] ?? []).map((alert) => (
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
                      className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-400">
                      View
                    </Link>
                  </p>
                ))}
                <p className="text-sm font-medium tabular-nums">
                  {countBySection[section.title]}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <SalesSummaryCard />
    </div>
  );
};

export default AdminPage;
