import type { Metadata } from "next";
import Link from "next/link";
import { getStoreSettings } from "@/server/admin/settings";

export const metadata: Metadata = {
  title: "Returns Policy",
  description: "How Unboxd handles returns, exchanges, and restocking.",
};

const page = async () => {
  const { returnWindowDays } = await getStoreSettings();
  return (
    <div className="flex flex-col gap-8 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Returns Policy
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          If something is not right, request a return from your Orders page
          within {returnWindowDays} days. Customer first, every time.
        </p>
      </header>
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          How returns work
        </h2>
        <ol className="text-muted-foreground flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed">
          <li>Open Orders and pick the order within the return window.</li>
          <li>Request the return and watch the status move to RETURNED.</li>
          <li>We restock the variant so stock counts stay honest.</li>
          <li>We guide you through exchange or refund from there.</li>
        </ol>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Track it
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Every status change lands on your Orders page with live updates, so
          you always know where the return stands.
        </p>
      </section>
      <footer className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link
          href="/orders"
          className="hover:text-primary underline underline-offset-4">
          Go to orders
        </Link>
        <Link
          href="/policies/shipping"
          className="hover:text-primary underline underline-offset-4">
          Shipping
        </Link>
        <Link
          href="/policies/warranty"
          className="hover:text-primary underline underline-offset-4">
          Warranty
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
