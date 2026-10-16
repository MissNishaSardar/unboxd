"use client";

import ThemeToggleButton from "@/components/Layout/ThemeToggleButton";
import UserMenu from "@/components/Layout/UserMenu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/shadcnui/breadcrumb";
import { Separator } from "@/components/shadcnui/separator";
import { SidebarTrigger } from "@/components/shadcnui/sidebar";
import { iconButtonClass } from "@/components/Layout/Header";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  orders: "Orders",
  inventory: "Inventory",
  products: "Products",
  categories: "Categories",
  users: "Users",
  new: "New",
  edit: "Edit",
};

function toLabel(segment: string): string {
  if (LABELS[segment]) return LABELS[segment];
  if (/^[a-z0-9]{20,}$/i.test(segment) || /^\d+$/.test(segment))
    return `#${segment.slice(0, 8)}`;
  return (
    segment.charAt(0).toUpperCase() + segment.slice(1).replaceAll("-", " ")
  );
}

const AdminHeader = () => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, idx) => {
    const href = `/${segments.slice(0, idx + 1).join("/")}`;
    return { segment: seg, href, label: toLabel(seg) };
  });

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <span
                key={crumb.href}
                className="contents">
                <BreadcrumbItem>
                  {isLast ?
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  : <BreadcrumbLink
                      render={
                        <Link href={crumb.href as never}>{crumb.label}</Link>
                      }
                    />
                  }
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggleButton className={iconButtonClass} />
        <UserMenu />
      </div>
    </header>
  );
};

export default AdminHeader;
