"use client";

import UnboxdLogo from "@/components/Brand/UnboxdLogo";
import ThemeToggleButton from "@/components/Layout/ThemeToggleButton";
import { Button } from "@/components/shadcnui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcnui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/shadcnui/sheet";
import { useMounted } from "@/hooks/use-mounted";
import { authClient } from "@/lib/auth-client";
import { cartCountAtom, cartDrawerOpenAtom, clearCart } from "@/lib/cart/atoms";
import { PUBLIC_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { wishlistAtom } from "@/lib/wishlist/atoms";
import { useAtomValue, useSetAtom } from "jotai";
import {
  HeartIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  ShieldIcon,
  ShoppingCartIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import HeaderSearch from "@/components/Search/HeaderSearch";

const iconButtonClass =
  "size-[38px] shrink-0 rounded-full border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border/50 transition-colors";

const Header = () => {
  const { data: session, isPending } = authClient.useSession();
  const cartCount = useAtomValue(cartCountAtom);
  const wishlistCount = useAtomValue(wishlistAtom).length;
  const setCartOpen = useSetAtom(cartDrawerOpenAtom);
  const router = useRouter();
  const mounted = useMounted();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleCartClick = () => {
    if (!mounted || isPending) return;
    if (session) {
      setCartOpen(true);
    } else {
      router.push("/auth/login?callbackUrl=/cart");
    }
  };

  const handleWishlistClick = () => {
    if (!mounted || isPending) return;
    if (session) {
      router.push("/wishlist" as never);
    } else {
      router.push("/auth/login?callbackUrl=/wishlist" as never);
    }
  };

  return (
    <>
      <header className="border-border/40 bg-background/70 supports-[backdrop-filter]:bg-background/60 dark:bg-background/40 dark:border-border/30 sticky top-0 z-40 w-full border-b backdrop-blur-xl">
        {/* subtle page glow that shows through the glass */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(700px_circle_at_50%_-10%,oklch(0.62_0.16_277/0.10),transparent_70%)] dark:bg-[radial-gradient(800px_circle_at_50%_-10%,oklch(0.55_0.18_277/0.16),transparent_70%)]"
        />
        <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* left: hamburger + brand */}
          <div className="flex shrink-0 items-center gap-2">
            <Sheet
              open={mobileOpen}
              onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open menu"
                    className={cn(iconButtonClass, "min-[920px]:hidden")}>
                    <MenuIcon
                      aria-hidden="true"
                      className="size-[18px]"
                    />
                  </Button>
                }
              />
              <SheetContent
                side="left"
                className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <UnboxdLogo
                      className="size-6"
                      aria-hidden="true"
                    />
                    Unboxd
                  </SheetTitle>
                </SheetHeader>
                <div className="px-4">
                  <Suspense>
                    <HeaderSearch
                      onNavigate={() => setMobileOpen(false)}
                      className="mx-0 max-w-none"
                    />
                  </Suspense>
                </div>
                <nav
                  aria-label="Primary"
                  className="flex flex-col gap-1 px-4">
                  {PUBLIC_NAV.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href as never}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                          isActive ?
                            "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}>
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
            <Link
              href="/"
              className="flex items-center gap-2">
              <UnboxdLogo
                className="size-7 shrink-0"
                aria-hidden="true"
              />
              <span className="font-heading text-[17px] font-semibold tracking-tight">
                Unboxd
              </span>
            </Link>
            {/* desktop nav pills — visible ≥920px */}
            <nav
              aria-label="Primary"
              className="ml-2 hidden items-center gap-1.5 min-[920px]:flex">
              {PUBLIC_NAV.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href as never}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                      isActive ?
                        "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* center: search auto-centers flex:1 max-w-[420px] mx-auto */}
          <div className="hidden flex-1 justify-center min-[640px]:flex">
            <Suspense>
              <HeaderSearch className="max-w-[420px]" />
            </Suspense>
          </div>

          {/* right: actions — all 38px hover buttons */}
          <div className="flex shrink-0 items-center gap-1">
            {/* search collapses to icon <640px */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={searchOpen ? "Close search" : "Open search"}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
              className={cn(iconButtonClass, "min-[640px]:hidden")}>
              <SearchIcon
                aria-hidden="true"
                className="size-[18px]"
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Wishlist"
              className={cn(iconButtonClass, "relative")}
              onClick={handleWishlistClick}>
              <HeartIcon
                aria-hidden="true"
                className="size-[18px]"
              />
              {mounted && session && wishlistCount > 0 && (
                <span className="bg-primary text-primary-foreground border-background absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 px-1 text-[11px] leading-none font-semibold tabular-nums shadow-sm">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open cart"
              className={cn(iconButtonClass, "relative")}
              onClick={handleCartClick}>
              <ShoppingCartIcon
                aria-hidden="true"
                className="size-[18px]"
              />
              {mounted && cartCount > 0 && (
                <span className="bg-primary text-primary-foreground border-background absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 px-1 text-[11px] leading-none font-semibold tabular-nums shadow-sm">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>
            <div className="flex items-center">
              <ThemeToggleButton className={iconButtonClass} />
            </div>
            {isPending ?
              null
            : session ?
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="focus-visible:ring-ring border-border/50 bg-muted/50 hover:border-border ml-1 flex size-[38px] shrink-0 items-center justify-center overflow-hidden rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
                      onClick={() =>
                        router.push(
                          (session.user.role === "admin" ?
                            "/admin"
                          : "/dashboard") as never,
                        )
                      }>
                      {session.user.role === "admin" ?
                        <ShieldIcon aria-hidden="true" />
                      : <LayoutDashboardIcon aria-hidden="true" />}
                      {session.user.role === "admin" ?
                        "Admin Dashboard"
                      : "Dashboard"}
                    </DropdownMenuItem>
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
            : <Button
                render={<Link href="/auth/login" />}
                nativeButton={false}
                size="sm"
                className="hover:shadow-primary/20 ml-1 rounded-full px-4 font-medium shadow-sm transition-shadow hover:shadow-[0_0_20px_oklch(0.55_0.2_277/0.35)]">
                Sign in
              </Button>
            }
          </div>
        </div>
        {/* mobile search bar — expands when icon tapped, always hidden ≥640px */}
        {searchOpen && (
          <div className="border-border/40 bg-background/80 border-t px-4 py-2 backdrop-blur-xl min-[640px]:hidden">
            <Suspense>
              <HeaderSearch
                autoFocus
                className="mx-0 max-w-none"
                onNavigate={() => setSearchOpen(false)}
              />
            </Suspense>
          </div>
        )}
      </header>
      {/* legacy second row for <640 no-JS fallback — hidden by new icon toggle, keep for sheet only */}
    </>
  );
};

export default Header;
