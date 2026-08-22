import CartProvider from "@/components/Cart/CartProvider";
import ImpersonationBanner from "@/components/Admin/ImpersonationBanner";
import Header from "@/components/Layout/Header";
import WishlistProvider from "@/components/Wishlist/WishlistProvider";
import { auth } from "@/lib/auth";
import { LayoutProps } from "@/lib/types";
import { headers } from "next/headers";

const PublicLayout = async ({ children }: LayoutProps) => {
  const headerList = await headers();
  const shell = headerList.get("x-route-shell");

  if (shell === "auth") {
    return <>{children}</>;
  }

  const session = await auth.api.getSession({
    headers: headerList,
  });

  return (
    <div>
      {session?.session.impersonatedBy && (
        <ImpersonationBanner name={session.user.name} />
      )}
      <Header />
      <main>{children}</main>
      <CartProvider />
      <WishlistProvider />
    </div>
  );
};

export default PublicLayout;
