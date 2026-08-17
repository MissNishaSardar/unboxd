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
}: {
  productId: string;
  className?: string;
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
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isWishlisted}
      onClick={handleToggle}
      className={cn("bg-background/80 backdrop-blur-sm", className)}>
      <HeartIcon
        aria-hidden="true"
        className={cn(isWishlisted && "fill-current text-red-500")}
      />
    </Button>
  );
};

export default WishlistButton;
