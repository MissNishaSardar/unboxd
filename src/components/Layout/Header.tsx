"use client";

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
import { useMounted } from "@/hooks/use-mounted";
import { authClient } from "@/lib/auth-client";
import { cartCountAtom, cartDrawerOpenAtom, clearCart } from "@/lib/cart/atoms";
import { wishlistAtom } from "@/lib/wishlist/atoms";
import { useAtomValue, useSetAtom } from "jotai";
import {
  HeartIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  ShoppingCartIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Header = () => {
  const { data: session, isPending } = authClient.useSession();
  const cartCount = useAtomValue(cartCountAtom);
  const wishlistCount = useAtomValue(wishlistAtom).length;
  const setCartOpen = useSetAtom(cartDrawerOpenAtom);
  const router = useRouter();
  const mounted = useMounted();

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
    <header className="flex items-center justify-between border-b px-6 py-3">
      <Link
        href="/"
        className="font-heading text-lg font-medium">
        Unboxd
      </Link>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Wishlist"
          className="relative"
          onClick={handleWishlistClick}>
          <HeartIcon
            aria-hidden="true"
            size={32}
          />
          {mounted && session && wishlistCount > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
              {wishlistCount}
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open cart"
          className="relative"
          onClick={handleCartClick}>
          <ShoppingCartIcon
            aria-hidden="true"
            size={32}
          />
          {mounted && cartCount > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
              {cartCount}
            </span>
          )}
        </Button>
        <div className="ml-1 flex items-center">
          <ThemeToggleButton />
        </div>
        {isPending ?
          null
        : session ?
          <>
            {session.user.role === "admin" && (
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/admin" />}
                nativeButton={false}>
                Admin
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="focus-visible:ring-ring ml-2 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
                    onClick={() => router.push("/dashboard" as never)}>
                    <LayoutDashboardIcon aria-hidden="true" />
                    Dashboard
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={async () => {
                      await authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            clearCart();
                            router.push("/");
                            router.refresh();
                          },
                        },
                      });
                    }}>
                    <LogOutIcon aria-hidden="true" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        : <Button
            render={<Link href="/auth/login" />}
            nativeButton={false}
            size="sm"
            className="ml-1">
            Sign in
          </Button>
        }
      </div>
    </header>
  );
};

export default Header;
