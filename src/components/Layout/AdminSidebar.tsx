"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BoxesIcon,
  FolderTreeIcon,
  LayoutDashboardIcon,
  PackageIcon,
  PackageOpenIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/shadcnui/sidebar";

const ADMIN_NAV = [
  { href: "/admin" as const, label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/orders" as const, label: "Orders", icon: PackageIcon },
  { href: "/admin/inventory" as const, label: "Inventory", icon: BoxesIcon },
  {
    href: "/admin/products" as const,
    label: "Products",
    icon: PackageOpenIcon,
  },
  {
    href: "/admin/categories" as const,
    label: "Categories",
    icon: FolderTreeIcon,
  },
  { href: "/admin/users" as const, label: "Users", icon: UsersIcon },
  { href: "/admin/settings" as const, label: "Settings", icon: SettingsIcon },
] as const;

const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
            U
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm leading-none font-medium">
              Unboxd
            </span>
            <span className="text-muted-foreground truncate text-xs">
              Admin
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ADMIN_NAV.map((item) => {
                const isActive =
                  item.href === "/admin" ?
                    pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={
                        <Link href={item.href as never}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};

export default AdminSidebar;
