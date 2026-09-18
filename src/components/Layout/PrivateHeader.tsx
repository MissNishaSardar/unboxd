"use client";

import ThemeToggleButton from "@/components/Layout/ThemeToggleButton";
import { Button } from "@/components/shadcnui/button";
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
import { useAtomValue, useSetAtom } from "jotai";
import { useMounted } from "@/hooks/use-mounted";
import { authClient } from "@/lib/auth-client";
import { cartCountAtom, cartDrawerOpenAtom, clearCart } from "@/lib/cart/atoms";
import { cn } from "@/lib/utils";
import { iconButtonClass } from "@/components/Layout/Header";
import { LogOutIcon, ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  orders: "Orders",
  wishlist: "Wishlist",
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
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const mounted = useMounted();
  const cartCount = useAtomValue(cartCountAtom);
  const setCartOpen = useSetAtom(cartDrawerOpenAtom);
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
      <div className="ml-auto flex items-center gap-1">
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
            <span className="border-background absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 bg-violet-600 px-1 text-[11px] leading-none font-semibold text-white tabular-nums shadow-sm">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Button>
        <ThemeToggleButton className={iconButtonClass} />
        {session && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="border-border bg-muted hover:bg-accent focus-visible:ring-ring flex size-[38px] shrink-0 items-center justify-center overflow-hidden rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none"
              aria-label="User menu">
              {session.user.image ?
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt=""
                  aria-hidden="true"
                  width={38}
                  height={38}
                  className="size-full object-cover"
                />
              : <span className="bg-muted text-foreground flex size-full items-center justify-center text-xs font-semibold">
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

export default PrivateHeader;
