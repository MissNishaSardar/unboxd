"use client";

import { formatPrice } from "@/lib/format";
import UnboxdLogo from "@/components/Brand/UnboxdLogo";
import {
  BanknoteIcon,
  CalendarClockIcon,
  CreditCardIcon,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";

export type FooterCategory = {
  slug: string;
  name: string;
};

const shopLinksFallback: FooterCategory[] = [
  { slug: "smartphones", name: "Smartphones" },
  { slug: "gaming-laptops", name: "Gaming Laptops" },
  { slug: "headphones", name: "Headphones" },
  { slug: "earbuds", name: "Earbuds" },
  { slug: "speakers", name: "Speakers" },
  { slug: "chargers-cables", name: "Chargers and Cables" },
  { slug: "cases-protection", name: "Cases and Protection" },
];

const Footer = ({
  categories,
  storeName = "unboxd",
  codEnabled,
  deliveryDays,
  freeShippingThreshold,
}: {
  categories?: FooterCategory[];
  storeName?: string;
  codEnabled: boolean;
  deliveryDays: number;
  freeShippingThreshold: string;
}) => {
  const shopCategories =
    categories && categories.length > 0 ? categories : shopLinksFallback;
  return (
    <footer
      aria-label="Site footer"
      className="border-border bg-card text-card-foreground border-t">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-2">
              <UnboxdLogo
                className="size-6 shrink-0"
                aria-hidden="true"
              />
              <span className="font-heading bg-gradient-to-b from-[#0f89c0] to-[#0b5a82] bg-clip-text text-[16px] font-semibold tracking-tight text-transparent dark:from-[#7dd3f8] dark:to-[#0ea5e9]">
                {storeName}
              </span>
            </Link>
            <p className="text-muted-foreground max-w-[28ch] text-sm leading-relaxed">
              Electronics, unboxed. Smartphones, laptops, audio and accessories
              with cash on delivery and tracked delivery across India.
            </p>
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                Why shop with us
              </p>
              <ul className="mt-3 space-y-2.5">
                {codEnabled && (
                  <li className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <BanknoteIcon
                      aria-hidden="true"
                      className="size-3.5 shrink-0"
                    />
                    Cash on delivery across India
                  </li>
                )}
                <li className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <TruckIcon
                    aria-hidden="true"
                    className="size-3.5 shrink-0"
                  />
                  Free shipping above {formatPrice(freeShippingThreshold)}
                </li>
                <li className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <CalendarClockIcon
                    aria-hidden="true"
                    className="size-3.5 shrink-0"
                  />
                  Delivered in about {deliveryDays} days
                </li>
              </ul>
            </div>
          </div>

          <nav aria-label="Shop categories">
            <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              Shop
            </p>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link
                  href="/products"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  All products
                </Link>
              </li>
              {shopCategories.slice(0, 8).map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={{
                      pathname: "/products",
                      query: { category: cat.slug },
                    }}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Support">
            <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              Support
            </p>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Shipping and returns
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Warranty
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-border mt-8 flex flex-col items-center justify-between gap-4 border-t pt-6 md:flex-row">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <CreditCardIcon
                aria-hidden="true"
                className="size-3.5"
              />
              Cash on Delivery
            </span>
            <span>Visa</span>
            <span>Mastercard</span>
            <span>UPI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
