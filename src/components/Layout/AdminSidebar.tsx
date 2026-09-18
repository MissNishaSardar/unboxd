"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderTreeIcon,
  LayoutDashboardIcon,
  PackageIcon,
  PackageOpenIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

import SidebarBrand from "@/components/Brand/SidebarBrand";
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

const AdminSidebarNavItems = () => {
  const pathname = usePathname();

  return (
    <>
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
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        );
      })}
    </>
  );
};

const AdminSidebar = () => {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarBrand
          href="/admin"
          subtitle="Admin"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <AdminSidebarNavItems />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};

export default AdminSidebar;
