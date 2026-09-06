import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Warranty Policy",
  description: "Authenticity and warranty details for Unboxd products.",
};

const page = () => {
  return (
    <div className="flex flex-col gap-6 py-8">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Warranty Policy
      </h1>
      <p className="text-muted-foreground leading-relaxed">
        All products are genuine and sourced from verified brands. Warranty is
        as per the brand. Every order snapshots price and name at purchase, so
        your receipt stays accurate even if catalog prices change.
      </p>
    </div>
  );
};

export default page;
