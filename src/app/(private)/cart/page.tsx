import type { Metadata } from "next";
import CartClient from "./CartClient";
import { getStoreSettings } from "@/server/admin/settings";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review items in your Unboxd cart and proceed to checkout.",
};

const CartPage = async () => {
  const settings = await getStoreSettings();
  return (
    <CartClient
      freeShippingThreshold={Number(settings.freeShippingThreshold)}
      shippingFlatRate={Number(settings.shippingFlatRate)}
      returnWindowDays={settings.returnWindowDays}
    />
  );
};

export default CartPage;
