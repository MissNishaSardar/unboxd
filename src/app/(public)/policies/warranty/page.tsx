import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Warranty Policy",
  description: "Authenticity and warranty details for Unboxd products.",
};

const page = () => {
  return (
    <div className="flex flex-col gap-8 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Warranty Policy
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          All products are genuine and sourced from verified brands. Warranty is
          as per the brand.
        </p>
      </header>
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Authenticity
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Every brand carries a verified badge across the catalog, and each
          product page names the exact variant you buy, so what you buy is what
          we have.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Honest receipts
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Every order snapshots price and name at purchase, so your receipt
          stays accurate even if catalog prices change later.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Claim help
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          For a warranty claim, share your order ID on the contact page and we
          trace it end to end with you.
        </p>
      </section>
      <footer className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link
          href="/policies/shipping"
          className="hover:text-primary underline underline-offset-4">
          Shipping
        </Link>
        <Link
          href="/policies/returns"
          className="hover:text-primary underline underline-offset-4">
          Returns
        </Link>
        <Link
          href="/contact"
          className="hover:text-primary underline underline-offset-4">
          Contact us
        </Link>
      </footer>
    </div>
  );
};

export default page;
