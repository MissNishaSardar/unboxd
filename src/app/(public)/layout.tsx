import CartProvider from "@/components/Cart/CartProvider";
import ImpersonationBanner from "@/components/Admin/ImpersonationBanner";
import Container from "@/components/Layout/Container";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import WishlistProvider from "@/components/Wishlist/WishlistProvider";
import { auth } from "@/lib/auth";
import { LayoutProps } from "@/lib/types";
import { getCategoriesWithCounts } from "@/server/catalog";
import { getBrandsWithCounts } from "@/server/brands";
import { headers } from "next/headers";

const PublicLayout = async ({ children }: LayoutProps) => {
  const headerList = await headers();

  const [session, categories, brands] = await Promise.all([
    auth.api.getSession({
      headers: headerList,
    }),
    getCategoriesWithCounts(),
    getBrandsWithCounts(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      {session?.session.impersonatedBy && (
        <ImpersonationBanner name={session.user.name} />
      )}
      <Header brands={brands} />
      <main className="flex-1 overflow-x-clip">
        <Container className="py-10">{children}</Container>
      </main>
      <Footer categories={categories} />
      <CartProvider />
      <WishlistProvider />
    </div>
  );
};

export default PublicLayout;
