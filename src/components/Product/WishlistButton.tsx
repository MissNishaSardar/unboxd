"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { HeartIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { wishlistAtom } from "@/lib/wishlist/atoms";
import { toggleWishlist } from "@/server/wishlist";
import { Button } from "@/components/shadcnui/button";
import { toast } from "@/components/shadcnui/toast";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";

const WishlistButton = ({
  productId,
  className,
  size = "icon-lg",
  variant = "outline",
}: {
  productId: string;
  className?: string;
  size?: "icon" | "icon-sm" | "icon-lg" | "icon-xs";
  variant?: "outline" | "ghost" | "secondary" | "default";
}) => {
  const ids = useAtomValue(wishlistAtom);
  const setIds = useSetAtom(wishlistAtom);
  const { data: session, isPending } = authClient.useSession();
  const mounted = useMounted();
  const router = useRouter();
  const pathname = usePathname();

  const isWishlisted = mounted && ids.includes(productId);

  const handleToggle = async () => {
    if (isPending) return;
    if (!session) {
      toast.add({
        title: "Sign in to save items to your wishlist",
        type: "error",
      });
      router.push(`/auth/login?callbackUrl=${pathname}`);
      return;
    }
    try {
      const added = await toggleWishlist(productId);
      setIds((current) =>
        added ?
          [...current, productId]
        : current.filter((id) => id !== productId),
      );
      toast.add({
        title: added ? "Added to wishlist" : "Removed from wishlist",
        type: "success",
      });
    } catch {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isWishlisted}
      onClick={handleToggle}
      className={cn(
        "shrink-0 rounded-md border-2",
        variant === "outline" && "bg-background",
        variant === "outline" &&
          isWishlisted &&
          "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30",
        className,
      )}>
      <HeartIcon
        aria-hidden="true"
        className={cn("size-5", isWishlisted && "fill-red-500 text-red-500")}
      />
    </Button>
  );
};

export default WishlistButton;
