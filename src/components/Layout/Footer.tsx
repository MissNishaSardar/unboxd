"use client";

import UnboxdLogo from "@/components/Brand/UnboxdLogo";
import { Button } from "@/components/shadcnui/button";
import { Input } from "@/components/shadcnui/input";
import { CreditCardIcon } from "lucide-react";
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

const Footer = ({ categories }: { categories?: FooterCategory[] }) => {
  const shopCategories =
    categories && categories.length > 0 ? categories : shopLinksFallback;
  return (
    <footer
      aria-label="Site footer"
      className="border-t border-white/10 bg-[rgba(5,5,9,0.92)] text-white/90">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-2">
              <UnboxdLogo
                className="size-6 shrink-0"
                aria-hidden="true"
              />
              <span className="font-heading text-[16px] font-semibold tracking-tight text-white">
                Unboxd
              </span>
            </Link>
            <p className="max-w-[28ch] text-sm leading-relaxed text-white/60">
              Electronics, unboxed. Smartphones, laptops, audio and accessories
              with cash on delivery and tracked delivery across India.
            </p>
          </div>

          <nav aria-label="Shop categories">
            <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
              Shop
            </p>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-white/70 transition-colors hover:text-white">
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
                    className="text-sm text-white/70 transition-colors hover:text-white">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Support">
            <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
              Support
            </p>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-white/70 transition-colors hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-white/70 transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-white/70 transition-colors hover:text-white">
                  Shipping and returns
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-white/70 transition-colors hover:text-white">
                  Warranty
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-white/70 transition-colors hover:text-white">
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-white/70 transition-colors hover:text-white">
                  Terms
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex flex-col">
            <form
              aria-label="Newsletter signup"
              className="flex gap-2"
              onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Get 10% off - enter your email"
                aria-label="Email address"
                required
                className="h-9 flex-1 rounded-full border-white/10 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-white/20 focus-visible:ring-white/30"
              />
              <Button
                type="submit"
                size="sm"
                className="h-9 shrink-0 rounded-full bg-white px-5 text-black hover:bg-white/90">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Unboxd. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-xs text-white/40">
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
