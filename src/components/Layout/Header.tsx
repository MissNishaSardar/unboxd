"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { HeartIcon, ShoppingCartIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/shadcnui/button";
import { cartCountAtom, cartDrawerOpenAtom } from "@/lib/cart/atoms";
import { useMounted } from "@/hooks/use-mounted";

const Header = () => {
  const { data: session, isPending } = authClient.useSession();
  const cartCount = useAtomValue(cartCountAtom);
  const setCartOpen = useSetAtom(cartDrawerOpenAtom);
  const router = useRouter();
  const mounted = useMounted();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
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
          render={<Link href="/wishlist" />}
          nativeButton={false}>
          <HeartIcon aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open cart"
          className="relative"
          onClick={() => setCartOpen(true)}>
          <ShoppingCartIcon aria-hidden="true" />
          {mounted && cartCount > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
              {cartCount}
            </span>
          )}
        </Button>
        {isPending ?
          null
        : session ?
          <Button
            variant="outline"
            size="sm"
            className="ml-1"
            onClick={handleSignOut}>
            Sign out
          </Button>
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
