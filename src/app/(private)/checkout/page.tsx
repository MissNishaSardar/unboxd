import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Unboxd order with cash on delivery.",
};

const CheckoutPage = () => <CheckoutClient />;

export default CheckoutPage;
