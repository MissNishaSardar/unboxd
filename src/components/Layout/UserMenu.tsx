"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2Icon,
  LogOutIcon,
  ShieldIcon,
  StoreIcon,
  UserRoundIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { clearCart } from "@/lib/cart/atoms";
import { LOGOUT_DELAY_MS } from "@/lib/constants";
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/shadcnui/alert-dialog";
import { Button } from "@/components/shadcnui/button";

// Single avatar menu shared by the storefront header, the admin shell, and
// the account shell. The showStorefront prop is true for the private and
// admin shells and false for the storefront header, where the logo already
// points home.
const UserMenu = ({ showStorefront = true }: { showStorefront?: boolean }) => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  if (!session) return null;

  const isAdmin = session.user.role === "admin";

  const handleSignOut = async () => {
    setLoggingOut(true);
    // Show the spinner in the confirm dialog for the full delay before
    // signing out. Signing out first clears the session, which unmounts this
    // menu through the session hook and hides the dialog mid spin.
    await new Promise((resolve) => setTimeout(resolve, LOGOUT_DELAY_MS));
    setConfirmSignOut(false);
    try {
      await authClient.signOut();
    } catch {
      // The session may still be live, so keep the cart and report the
      // failure instead of claiming success.
      setLoggingOut(false);
      toast.add({
        title: "Could not sign out",
        description: "Check your connection and try again",
        type: "error",
      });
      return;
    }
    clearCart();
    toast.add({ title: "Signed out", type: "success" });
    setLoggingOut(false);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="border-border bg-muted hover:bg-accent focus-visible:ring-ring flex size-[38px] shrink-0 items-center justify-center overflow-hidden rounded-full border p-[3px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
          aria-label="User menu">
          {session.user.image ?
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              aria-hidden="true"
              width={38}
              height={38}
              className="size-full rounded-full object-cover"
            />
          : <span className="bg-muted text-foreground flex size-full items-center justify-center rounded-full text-xs font-semibold">
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
            <DropdownMenuItem
              onClick={() => router.push("/myprofile" as never)}>
              <UserRoundIcon aria-hidden="true" />
              My profile
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => router.push("/admin" as never)}>
                <ShieldIcon aria-hidden="true" />
                Admin panel
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirmSignOut(true)}>
              <LogOutIcon aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog
        open={confirmSignOut}
        onOpenChange={(open) => {
          if (!loggingOut) setConfirmSignOut(open);
        }}>
        <AlertDialogContent>
          <AlertDialogTitle>Log out?</AlertDialogTitle>
          <AlertDialogDescription>
            You will need to sign in again to use your account. Your local cart
            will be cleared.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOut}>
              Stay logged in
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              disabled={loggingOut}>
              {loggingOut && (
                <Loader2Icon
                  className="animate-spin"
                  data-icon="inline-start"
                  aria-hidden="true"
                />
              )}
              {loggingOut ? "Logging out" : "Log out"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserMenu;
