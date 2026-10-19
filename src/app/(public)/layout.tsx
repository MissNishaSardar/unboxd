import CartProvider from "@/components/Cart/CartProvider";
import SaleBanner from "@/components/Layout/SaleBanner";
import Container from "@/components/Layout/Container";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import WishlistProvider from "@/components/Wishlist/WishlistProvider";
import { LayoutProps } from "@/lib/types";
import { getCategoriesWithCounts } from "@/server/catalog";
import { getBrandsWithCounts } from "@/server/brands";
import { getStoreSettings } from "@/server/admin/settings";

const PublicLayout = async ({ children }: LayoutProps) => {
  const [categories, brands, settings] = await Promise.all([
    getCategoriesWithCounts(),
    getBrandsWithCounts(),
    getStoreSettings(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SaleBanner />
      <Header brands={brands} />
      <main className="flex-1 overflow-x-clip">
        <Container className="py-10">{children}</Container>
      </main>
      <Footer
        categories={categories}
        storeName={settings.storeName}
        codEnabled={settings.codEnabled}
        deliveryDays={settings.deliveryDays}
        freeShippingThreshold={settings.freeShippingThreshold}
      />
      <CartProvider />
      <WishlistProvider />
    </div>
  );
};

export default PublicLayout;
