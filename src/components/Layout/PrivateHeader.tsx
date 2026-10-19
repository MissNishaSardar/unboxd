"use client";

import ThemeToggleButton from "@/components/Layout/ThemeToggleButton";
import UserMenu from "@/components/Layout/UserMenu";
import { Button } from "@/components/shadcnui/button";
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
import { useAtomValue, useSetAtom } from "jotai";
import { useMounted } from "@/hooks/use-mounted";
import { cartCountAtom, cartDrawerOpenAtom } from "@/lib/cart/atoms";
import { cn } from "@/lib/utils";
import { iconButtonClass } from "@/components/Layout/Header";
import { ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  orders: "Orders",
  wishlist: "Wishlist",
  myprofile: "Profile",
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
  const mounted = useMounted();
  const cartCount = useAtomValue(cartCountAtom);
  const setCartOpen = useSetAtom(cartDrawerOpenAtom);
  const segments = pathname.split("/").filter(Boolean);

  // Build cumulative hrefs for linked crumbs
  const crumbs = segments.map((seg, idx) => {
    const href = `/${segments.slice(0, idx + 1).join("/")}`;
    return { segment: seg, href, label: toLabel(seg) };
  });

  // Empty or root -> Orders
  const showCrumbs =
    crumbs.length > 0 ?
      crumbs
    : [{ segment: "orders", href: "/orders", label: "Orders" }];

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
      <div className="ml-auto flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open cart"
          className={cn(iconButtonClass, "relative")}
          onClick={() => setCartOpen(true)}>
          <ShoppingBagIcon
            aria-hidden="true"
            className="size-[18px]"
          />
          {mounted && cartCount > 0 && (
            <span className="border-background bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 px-1 text-[11px] leading-none font-semibold tabular-nums shadow-sm">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Button>
        <ThemeToggleButton className={iconButtonClass} />
        <UserMenu showStorefront />
      </div>
    </header>
  );
};

export default PrivateHeader;
