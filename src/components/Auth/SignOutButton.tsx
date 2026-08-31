"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { clearCart } from "@/lib/cart/atoms";
import { Button } from "@/components/shadcnui/button";

const SignOutButton = () => {
  const router = useRouter();

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
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}>
      Sign out
    </Button>
  );
};

export default SignOutButton;
