"use client";

import { useEffect, useRef } from "react";
import { getDefaultStore } from "jotai";
import { authClient } from "@/lib/auth-client";
import { wishlistAtom } from "@/lib/wishlist/atoms";
import { getWishlistIds, syncWishlist } from "@/server/wishlist";

const store = getDefaultStore();

const WishlistProvider = () => {
  const { data: session } = authClient.useSession();
  const handled = useRef(false);

  useEffect(() => {
    if (session) {
      if (handled.current) return;
      handled.current = true;
      const localIds = store.get(wishlistAtom);
      void (async () => {
        try {
          if (localIds.length > 0) {
            await syncWishlist(localIds);
            store.set(wishlistAtom, []);
          }
          const serverIds = await getWishlistIds();
          store.set(wishlistAtom, serverIds);
        } catch {
          // session may have expired mid-flight; keep local state
        }
      })();
    } else {
      handled.current = false;
    }
  }, [session]);

  return null;
};

export default WishlistProvider;
