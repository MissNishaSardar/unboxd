import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LockIcon } from "lucide-react";
import ImpersonationBanner from "@/components/Admin/ImpersonationBanner";
import UnboxdLogo from "@/components/Brand/UnboxdLogo";
import AppSidebar from "@/components/Layout/AppSidebar";
import PrivateHeader from "@/components/Layout/PrivateHeader";
import CartProvider from "@/components/Cart/CartProvider";
import { SidebarInset, SidebarProvider } from "@/components/shadcnui/sidebar";
import { TooltipProvider } from "@/components/shadcnui/tooltip";
import { auth } from "@/lib/auth";
import Container from "@/components/Layout/Container";
import { LayoutProps } from "@/lib/types";

const PrivateLayout = async ({ children }: LayoutProps) => {
  const headerList = await headers();
  const shell = headerList.get("x-route-shell");
  const pathname = headerList.get("x-pathname") ?? "";

  if (shell === "admin" || pathname.startsWith("/admin")) {
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

  const session = await auth.api.getSession({
    headers: headerList,
  });

  if (!session) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <PrivateHeader />
          {session.session.impersonatedBy && (
            <ImpersonationBanner name={session.user.name} />
          )}
          <main className="flex-1 py-6">
            <Container>{children}</Container>
          </main>
        </SidebarInset>
        <CartProvider />
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default PrivateLayout;
