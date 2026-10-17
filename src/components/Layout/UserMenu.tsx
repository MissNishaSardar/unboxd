"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRightIcon,
  LogOutIcon,
  ShieldIcon,
  StoreIcon,
  UserRoundIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { clearCart } from "@/lib/cart/atoms";
import { stopImpersonating } from "@/server/admin/user-actions";
import { Badge } from "@/components/shadcnui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcnui/dropdown-menu";
import { toast } from "@/components/shadcnui/toast";

// Single avatar menu shared by the storefront header, the admin shell, and
// the account shell. The showStorefront prop is true for the private and
// admin shells and false for the storefront header, where the logo already
// points home.
const UserMenu = ({ showStorefront = true }: { showStorefront?: boolean }) => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isPending, setIsPending] = useState(false);

  if (!session) return null;

  const isAdmin = session.user.role === "admin";

  const handleStopImpersonating = async () => {
    setIsPending(true);
    const result = await stopImpersonating();
    setIsPending(false);
    if (!result.ok) {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch {
      // ignore server unexpected response, still clear local state
    }
    clearCart();
    router.push("/");
    router.refresh();
  };

  return (
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
            <span className="mt-1.5 block">
              <Badge
                variant="secondary"
                className="capitalize">
                {session.user.role ?? "user"}
              </Badge>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {showStorefront && (
            <DropdownMenuItem onClick={() => router.push("/" as never)}>
              <StoreIcon aria-hidden="true" />
              Storefront
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => router.push("/myprofile" as never)}>
            <UserRoundIcon aria-hidden="true" />
            My profile
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => router.push("/admin" as never)}>
              <ShieldIcon aria-hidden="true" />
              Admin panel
            </DropdownMenuItem>
          )}
          {session.session.impersonatedBy && (
            <DropdownMenuItem
              onClick={handleStopImpersonating}
              disabled={isPending}>
              <ArrowLeftRightIcon aria-hidden="true" />
              Stop impersonating
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOutIcon aria-hidden="true" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
