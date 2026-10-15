import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { getStoreSettings } from "@/server/admin/settings";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "How Unboxd ships, delivery timelines, and cash on delivery details.",
};

const page = async () => {
  const { codEnabled, deliveryDays, freeShippingThreshold, shippingFlatRate } =
    await getStoreSettings();
  return (
    <div className="flex flex-col gap-8 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Shipping Policy
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {codEnabled ?
            "Cash on delivery on every order. You inspect on delivery, then pay the courier."
          : "Checkout is paused right now, so no new orders can ship yet."}
        </p>
      </header>
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Rates
        </h2>
        <div className="border-muted grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              Below {formatPrice(Number(freeShippingThreshold))}
            </p>
            <p className="text-muted-foreground text-sm">
              Flat {formatPrice(Number(shippingFlatRate))} shipping per order.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              Above {formatPrice(Number(freeShippingThreshold))}
            </p>
            <p className="text-muted-foreground text-sm">
              Free shipping, tracked to your door.
            </p>
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Timelines
        </h2>
        <ol className="text-muted-foreground flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed">
          <li>Place your order with cash on delivery.</li>
          <li>We dispatch within 24 hours with live status in Orders.</li>
          <li>
            Most orders arrive within {deliveryDays} days depending on your
            pincode.
          </li>
          <li>Open the box, check color, storage, and build, then pay.</li>
        </ol>
      </section>
      <footer className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link
          href="/policies/returns"
          className="hover:text-primary underline underline-offset-4">
          Returns
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
