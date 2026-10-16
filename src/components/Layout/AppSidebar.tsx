"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, Package, Settings, Store } from "lucide-react";

import SidebarBrand from "@/components/Brand/SidebarBrand";
import { authClient } from "@/lib/auth-client";
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

const NAV_ITEMS = [
  { href: "/products" as const, label: "Shop", icon: Store },
  { href: "/dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders" as const, label: "Orders", icon: Package },
  { href: "/wishlist" as const, label: "Wishlist", icon: Heart },
  { href: "/settings" as const, label: "Settings", icon: Settings },
] as const;

const AppSidebar = () => {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  // Admins reach the store through the avatar menu Storefront entry,
  // so the account sidebar skips the Shop link for the admin role.
  // The full list stays while the session loads to avoid flicker.
  const isAdmin = session?.user?.role === "admin";
  const items = NAV_ITEMS.filter(
    (item) => !(isAdmin && item.href === "/products"),
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarBrand href="/" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  item.href === "/dashboard" ?
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

export default AppSidebar;
