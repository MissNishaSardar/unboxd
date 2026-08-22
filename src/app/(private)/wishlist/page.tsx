import type { Metadata } from "next";
import WishlistClient from "./WishlistClient";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Your saved Unboxd products — ready to revisit and purchase.",
};

const WishlistPage = () => <WishlistClient />;

export default WishlistPage;
