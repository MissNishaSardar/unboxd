import CartProvider from "@/components/Cart/CartProvider";
import Header from "@/components/Layout/Header";
import { LayoutProps } from "@/lib/types";
import { headers } from "next/headers";

const PublicLayout = async ({ children }: LayoutProps) => {
  const shell = (await headers()).get("x-route-shell");

  if (shell === "auth") {
    return <>{children}</>;
  }

  return (
    <div>
      <Header />
      <main>{children}</main>
      <CartProvider />
    </div>
  );
};

export default PublicLayout;
