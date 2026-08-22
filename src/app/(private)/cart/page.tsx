import type { Metadata } from "next";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review items in your Unboxd cart and proceed to checkout.",
};

const CartPage = () => <CartClient />;

export default CartPage;
