import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description:
    "Unboxd admin overview — manage products, orders, inventory, and users.",
};
import SalesSummaryCard from "@/components/Admin/SalesSummaryCard";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

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
    title: "Inventory",
    description: "Low-stock dashboard and quick edits",
    href: "/admin/inventory" as const,
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
  const session = await auth.api.getSession({ headers: await headers() });

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
          </Card>
        ))}
      </div>

      <SalesSummaryCard />
    </div>
  );
};

export default AdminPage;
