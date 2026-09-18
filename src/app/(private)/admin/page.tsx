import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAdminPage } from "@/lib/guard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Unboxd admin overview. Manage products, orders, and users.",
};
import SalesSummaryCard from "@/components/Admin/SalesSummaryCard";
import AttentionQueue from "@/components/Admin/AttentionQueue";
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Signed in as {session?.user.email} ({session?.user.role})
        </p>
      </div>
      <AttentionQueue attention={attention} />
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
              <CardContent>
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
