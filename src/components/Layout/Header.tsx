"use client";

import UnboxdLogo from "@/components/Brand/UnboxdLogo";
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
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { useAtomValue, useSetAtom } from "jotai";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  ShieldIcon,
  ShoppingBagIcon,
  UserIcon,
} from "lucide-react";
import BrandDropdown from "@/components/Layout/BrandDropdown";
import ThemeToggleButton from "@/components/Layout/ThemeToggleButton";
import type { BrandWithCount } from "@/server/brands";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import HeaderSearch from "@/components/Search/HeaderSearch";
import SearchAutocompleteInput from "@/components/Search/SearchAutocompleteInput";

export const iconButtonClass =
  "size-[38px] shrink-0 rounded-full border border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors";

const Header = ({ brands }: { brands?: BrandWithCount[] }) => {
  const { data: session, isPending } = authClient.useSession();
  const cartCount = useAtomValue(cartCountAtom);
  const setCartOpen = useSetAtom(cartDrawerOpenAtom);
  const router = useRouter();
  const mounted = useMounted();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileFilters, setMobileFilters] = useQueryStates(
    {
      brands: parseAsArrayOf(parseAsString, ",").withDefault([]),
      categories: parseAsArrayOf(parseAsString, ",").withDefault([]),
      category: parseAsString,
      page: parseAsInteger,
    },
    {
      shallow: false,
      urlKeys: {
        brands: "brand",
        categories: "categories",
        category: "category",
      },
    },
  );
  const activeBrands = mobileFilters.brands;
  const toggleMobileBrand = (slug: string) => {
    const isActive = activeBrands.includes(slug);
    const next =
      isActive ?
        activeBrands.filter((s) => s !== slug)
      : [...activeBrands, slug];
    if (pathname === "/products") {
      void setMobileFilters({ brands: next, page: null });
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (next.length > 0) params.set("brand", next.join(","));
      else params.delete("brand");
      params.delete("page");
      const qs = params.toString() ? `?${params.toString()}` : "";
      router.push(`/products${qs}` as never);
    }
    setMobileOpen(false);
  };
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleCartClick = () => {
    if (!mounted || isPending) return;
    if (session) {
      setCartOpen(true);
    } else {
      router.push("/auth/login?callbackUrl=/cart");
    }
  };

  return (
    <>
      <header className="border-border bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-3 px-4 sm:px-6">
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
                          "rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                          isActive ?
                            "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}>
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                {brands && brands.length > 0 && (
                  <div className="flex flex-col gap-2 px-4 pt-4">
                    <span className="text-muted-foreground px-3.5 text-xs font-semibold tracking-widest uppercase">
                      Brands
                    </span>
                    <div className="flex flex-col gap-1">
                      {brands.slice(0, 8).map((brand) => {
                        const isActive = activeBrands.includes(brand.slug);
                        return (
                          <button
                            key={brand.slug}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => toggleMobileBrand(brand.slug)}
                            className={cn(
                              "rounded-md px-3.5 py-2 text-left text-sm font-medium transition-colors",
                              isActive ?
                                "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}>
                            {brand.name}
                            <span
                              className={cn(
                                "ml-2 text-xs tabular-nums",
                                isActive ? "text-white/70" : (
                                  "text-muted-foreground/70"
                                ),
                              )}>
                              {brand.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between border-t px-4 py-3">
                  <span className="text-sm font-medium">Theme</span>
                  <ThemeToggleButton />
                </div>
              </SheetContent>
            </Sheet>

            <Link
              href="/"
              className="flex items-center gap-2">
              <UnboxdLogo
                className="size-7 shrink-0"
                aria-hidden="true"
              />
              <span className="font-heading text-foreground text-[17px] font-semibold tracking-tight">
                Unboxd
              </span>
            </Link>
            {brands && brands.length > 0 && <BrandDropdown brands={brands} />}
          </div>

          <div className="hidden flex-1 justify-center min-[640px]:flex">
            <div className="flex w-full max-w-[560px] flex-1 items-center">
              <SearchAutocompleteInput
                value={searchValue}
                onValueChange={setSearchValue}
                onSubmit={(q) => {
                  const trimmed = q.trim();
                  if (trimmed) {
                    router.push(
                      `/search?q=${encodeURIComponent(trimmed)}` as never,
                    );
                  } else {
                    router.push("/search" as never);
                  }
                }}
                variant="light"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
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
              aria-label="Open cart"
              className={cn(iconButtonClass, "relative")}
              onClick={handleCartClick}>
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

            {isPending ?
              null
            : session ?
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
                        } catch {}
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
            : <Link
                href="/auth/login"
                aria-label="Sign in"
                className="border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground flex size-[38px] items-center justify-center rounded-full border transition-colors">
                <UserIcon
                  aria-hidden="true"
                  className="size-[18px]"
                />
              </Link>
            }

            <ThemeToggleButton className={iconButtonClass} />
          </div>
        </div>

        {searchOpen && (
          <div className="border-border bg-background/80 border-t px-4 py-2 backdrop-blur-xl min-[640px]:hidden">
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
    </>
  );
};

export default Header;
