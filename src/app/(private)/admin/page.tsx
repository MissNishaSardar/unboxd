import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import {
  FolderTreeIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
} from "lucide-react";
import { requireAdminPage } from "@/lib/guard";
import ExpiringDealsCard from "@/components/Admin/ExpiringDealsCard";
import FulfillmentCard from "@/components/Admin/FulfillmentCard";
import RecentOrdersCard from "@/components/Admin/RecentOrdersCard";
import RevenueTrendCard from "@/components/Admin/RevenueTrendCard";
import SalesSummaryCard from "@/components/Admin/SalesSummaryCard";
import TopProductsCard from "@/components/Admin/TopProductsCard";
import { Card } from "@/components/shadcnui/card";
import { getAdminAttention, getAdminTotals } from "@/server/admin/queries";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Unboxd admin overview. Manage products, orders, and users.",
};

const withCount = (count: number, singular: string, plural?: string) =>
  `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;

const STATUS_AMBER = "text-amber-700 dark:text-amber-400";
const STATUS_MUTED = "text-muted-foreground";

const SECTIONS = [
  {
    title: "Products",
    href: "/admin/products" as const,
    icon: PackageIcon,
  },
  {
    title: "Orders",
    href: "/admin/orders" as const,
    icon: ShoppingCartIcon,
  },
  {
    title: "Categories",
    href: "/admin/categories" as const,
    icon: FolderTreeIcon,
  },
  {
    title: "Users",
    href: "/admin/users" as const,
    icon: UsersIcon,
  },
];

const AdminPage = async () => {
  await requireAdminPage();
  const [attention, totals] = await Promise.all([
    getAdminAttention(),
    getAdminTotals(),
  ]);

  type SectionStatus = { text: string; tone: string };

  const statusBySection: Record<string, SectionStatus> = {
    Products:
      attention.lowStock > 0 ?
        { text: withCount(attention.lowStock, "low stock"), tone: STATUS_AMBER }
      : { text: "Stock healthy", tone: STATUS_MUTED },
    Orders:
      attention.awaitingShipment > 0 || attention.inTransit > 0 ?
        {
          text: [
            attention.awaitingShipment > 0 ?
              withCount(attention.awaitingShipment, "awaiting shipment")
            : "",
            attention.inTransit > 0 ?
              withCount(attention.inTransit, "in transit")
            : "",
          ]
            .filter(Boolean)
            .join(", "),
          tone: STATUS_AMBER,
        }
      : { text: "All caught up", tone: STATUS_MUTED },
    Categories: {
      text:
        withCount(totals.parentCategories, "parent") +
        ", " +
        withCount(totals.subCategories, "subcategory", "subcategories"),
      tone: STATUS_MUTED,
    },
    Users: {
      text:
        withCount(totals.adminUsers, "admin") +
        ", " +
        withCount(totals.customerUsers, "customer"),
      tone: STATUS_MUTED,
    },
  };

  const emptyBySection: Record<string, string> = {
    Products: "Add your first product",
    Orders: "Orders appear after checkout",
    Categories: "Create your first category",
    Users: "New signups will show up here",
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
          const status = statusBySection[section.title];
          const count =
            section.title === "Products" ? totals.totalProducts
            : section.title === "Orders" ? totals.totalOrders
            : section.title === "Categories" ? totals.totalCategories
            : totals.totalUsers;
          const isEmpty = count === 0;
          const Icon = section.icon;
          return (
            <Link
              key={section.title}
              href={section.href as Route}
              className="group focus-visible:outline-none">
              <Card
                size="sm"
                className="group-hover:ring-foreground/25 group-focus-visible:ring-foreground/30 h-full gap-3 px-5 py-5 transition-shadow">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                    {section.title}
                  </span>
                  <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full">
                    <Icon
                      aria-hidden="true"
                      className="size-4.5"
                    />
                  </span>
                </div>
                <p className="text-3xl leading-none font-semibold tabular-nums">
                  {count}
                </p>
                <p
                  className={`flex items-center gap-1.5 text-xs ${status.tone}`}>
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full bg-current opacity-60"
                  />
                  <span>
                    {isEmpty ? emptyBySection[section.title] : status.text}
                  </span>
                </p>
              </Card>
            </Link>
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
