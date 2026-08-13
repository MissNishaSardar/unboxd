import CartProvider from "@/components/cart/cart-provider";
import Header from "@/components/Layout/Header";
import WishlistProvider from "@/components/wishlist/wishlist-provider";
import { LayoutProps } from "@/lib/types";

const PublicLayout = ({ children }: LayoutProps) => {
  return (
    <div>
      <Header />
      <main>{children}</main>
      <CartProvider />
      <WishlistProvider />
    </div>
  );
};

export default PublicLayout;
