import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "How Unboxd ships, delivery timelines, and cash on delivery details.",
};

const page = () => {
  return (
    <div className="flex flex-col gap-6 py-8">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Shipping Policy
      </h1>
      <p className="text-muted-foreground leading-relaxed">
        Cash on delivery on every order. Flat rate below the free shipping
        threshold, free above it. Most orders ship within 24 hours and arrive in
        2 to 5 business days depending on your pincode. You inspect on delivery,
        then pay the courier.
      </p>
    </div>
  );
};

export default page;
