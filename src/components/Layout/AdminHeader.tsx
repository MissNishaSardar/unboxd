"use client";

import ThemeToggleButton from "@/components/Layout/ThemeToggleButton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/shadcnui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcnui/dropdown-menu";
import { Separator } from "@/components/shadcnui/separator";
import { SidebarTrigger } from "@/components/shadcnui/sidebar";
import { authClient } from "@/lib/auth-client";
import { clearCart } from "@/lib/cart/atoms";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  StoreIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { stopImpersonating } from "@/server/admin/user-actions";
import { toast } from "@/components/shadcnui/toast";

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
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isPending, setIsPending] = useState(false);
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, idx) => {
    const href = `/${segments.slice(0, idx + 1).join("/")}`;
    return { segment: seg, href, label: toLabel(seg) };
  });

  const handleStopImpersonating = async () => {
    setIsPending(true);
    const result = await stopImpersonating();
    setIsPending(false);
    if (!result.ok) {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

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
      <div className="ml-auto flex items-center gap-4">
        <ThemeToggleButton />
        {session && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="focus-visible:ring-ring flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              aria-label="User menu">
              {session.user.image ?
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt=""
                  aria-hidden="true"
                  width={32}
                  height={32}
                  className="size-full object-cover"
                />
              : <span className="bg-muted text-muted-foreground flex size-full items-center justify-center text-xs font-semibold">
                  {session.user.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? "")
                    .join("") || "?"}
                </span>
              }
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <span className="block truncate text-sm font-medium">
                    {session.user.name}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs font-normal">
                    {session.user.email}
                  </span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push("/admin" as never)}>
                  <LayoutDashboardIcon aria-hidden="true" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/" as never)}>
                  <StoreIcon aria-hidden="true" />
                  Storefront
                </DropdownMenuItem>
                {session.session.impersonatedBy && (
                  <DropdownMenuItem
                    onClick={handleStopImpersonating}
                    disabled={isPending}>
                    <UserRoundIcon aria-hidden="true" />
                    Stop impersonating
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await authClient.signOut();
                    } catch {
                      // ignore server unexpected response, still clear local state
                    }
                    clearCart();
                    router.push("/");
                    router.refresh();
                  }}>
                  <LogOutIcon aria-hidden="true" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
