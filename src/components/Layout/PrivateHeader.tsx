"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  orders: "Orders",
  settings: "Settings",
  cart: "Cart",
  checkout: "Checkout",
  admin: "Admin",
};

function toLabel(segment: string): string {
  if (LABELS[segment]) return LABELS[segment];
  if (/^[a-z0-9]{20,}$/i.test(segment) || /^\d+$/.test(segment))
    return `#${segment.slice(0, 8)}`;
  return (
    segment.charAt(0).toUpperCase() + segment.slice(1).replaceAll("-", " ")
  );
}

const PrivateHeader = () => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Build cumulative hrefs for linked crumbs
  const crumbs = segments.map((seg, idx) => {
    const href = `/${segments.slice(0, idx + 1).join("/")}`;
    return { segment: seg, href, label: toLabel(seg) };
  });

  // Empty or root -> Dashboard
  const showCrumbs =
    crumbs.length > 0 ?
      crumbs
    : [{ segment: "dashboard", href: "/dashboard", label: "Dashboard" }];

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {showCrumbs.map((crumb, idx) => {
            const isLast = idx === showCrumbs.length - 1;
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
    </header>
  );
};

export default PrivateHeader;
