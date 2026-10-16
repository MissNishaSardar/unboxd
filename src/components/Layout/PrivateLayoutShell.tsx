"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockIcon } from "lucide-react";
import ImpersonationBanner from "@/components/Admin/ImpersonationBanner";
import UnboxdLogo from "@/components/Brand/UnboxdLogo";
import AppSidebar from "@/components/Layout/AppSidebar";
import PrivateHeader from "@/components/Layout/PrivateHeader";
import CartProvider from "@/components/Cart/CartProvider";
import Container from "@/components/Layout/Container";
import { SidebarInset, SidebarProvider } from "@/components/shadcnui/sidebar";
import { TooltipProvider } from "@/components/shadcnui/tooltip";

// Shell switcher for the private group. The parent server layout persists
// across client-side navigations, so a header-based pathname read goes stale
// when moving between /admin and the account pages (sidebar vanishes until
// a hard refresh). Reading the pathname here re-evaluates on every
// navigation, keeping the correct shell mounted.
const PrivateLayoutShell = ({
  children,
  defaultOpen,
  userName,
  impersonatedBy,
}: {
  children: React.ReactNode;
  defaultOpen: boolean;
  userName: string;
  impersonatedBy: boolean;
}) => {
  const pathname = usePathname();

  // Admin routes render their own sidebar through AdminLayout.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return <>{children}</>;
  }

  // Cart and checkout keep the minimal funnel shell (logo plus secure
  // note, no sidebar) while living in this group for routing purposes.
  if (
    pathname === "/cart" ||
    pathname.startsWith("/cart/") ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/")
  ) {
    return (
      <div className="flex min-h-svh flex-col">
        <header className="border-b">
          <Container className="flex h-14 items-center justify-between py-0">
            <Link
              href="/"
              className="flex items-center gap-2">
              <UnboxdLogo
                className="size-7"
                size={28}
                aria-hidden="true"
              />
              <span className="text-sm font-medium">Unboxd</span>
            </Link>
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <LockIcon
                className="size-3.5"
                aria-hidden="true"
              />
              Secure checkout
            </span>
          </Container>
        </header>
        <main className="flex-1 py-6 md:py-10">
          <Container>{children}</Container>
        </main>
        <CartProvider />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <PrivateHeader />
          {impersonatedBy && <ImpersonationBanner name={userName} />}
          <main className="flex-1 py-6">
            <Container>{children}</Container>
          </main>
        </SidebarInset>
        <CartProvider />
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default PrivateLayoutShell;
