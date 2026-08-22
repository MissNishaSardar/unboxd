import ProductGrid from "@/components/Product/ProductGrid";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { getCategoriesWithCounts, getFeaturedProducts } from "@/server/catalog";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightIcon,
  AudioLinesIcon,
  BanknoteIcon,
  CableIcon,
  Gamepad2Icon,
  HeadphonesIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SpeakerIcon,
  TagIcon,
  TruckIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Unboxd | Electronics, Unboxed",
  },
  description:
    "Shop smartphones, laptops, audio, and accessories with fast COD delivery.",
};

const categoryIcons: Record<string, LucideIcon> = {
  smartphones: SmartphoneIcon,
  "gaming-laptops": Gamepad2Icon,
  headphones: HeadphonesIcon,
  earbuds: AudioLinesIcon,
  speakers: SpeakerIcon,
  "chargers-cables": CableIcon,
  "cases-protection": ShieldCheckIcon,
};

const trustItems: { icon: LucideIcon; label: string }[] = [
  { icon: BanknoteIcon, label: "Cash on Delivery" },
  { icon: TruckIcon, label: "Fast Delivery" },
  { icon: RotateCcwIcon, label: "Easy Returns" },
];

const HomePage = async () => {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategoriesWithCounts(),
  ]);

  return (
    <div className="flex flex-col gap-20 px-6 py-10">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-16 md:px-12 md:py-24">
        <div
          aria-hidden
          className="bg-primary/20 pointer-events-none absolute -top-32 right-0 size-96 rounded-full blur-3xl"
        />
        <div className="relative flex flex-col items-start gap-6">
          <Badge variant="secondary">New season, unboxed</Badge>
          <h1 className="font-heading max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
            Electronics, unboxed
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            Latest smartphones, laptops, audio gear, and accessories. Order with
            cash on delivery and unbox it the same week.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              render={<Link href="/products" />}
              nativeButton={false}
              data-icon="inline-end">
              Shop now
              <ArrowRightIcon aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="#categories" />}
              nativeButton={false}>
              Browse categories
            </Button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
            {trustItems.map((item) => (
              <div
                key={item.label}
                className="text-muted-foreground flex items-center gap-2 text-sm">
                <item.icon
                  aria-hidden="true"
                  className="text-primary size-4"
                />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="categories"
        className="flex scroll-mt-24 flex-col gap-6">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Shop by category
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug] ?? TagIcon;
            return (
              <Link
                key={category.slug}
                href={{
                  pathname: "/products",
                  query: { category: category.slug },
                }}
                className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition-all hover:-translate-y-1 hover:border-zinc-700">
                <div className="text-primary flex size-10 items-center justify-center rounded-lg bg-zinc-900">
                  <Icon
                    aria-hidden="true"
                    className="size-5"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-heading text-sm font-medium">
                    {category.name}
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {category.count} item{category.count === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Featured
          </h2>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/products" />}
            nativeButton={false}
            data-icon="inline-end">
            View all
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </div>
        <ProductGrid products={featured} />
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-14 text-center md:py-20">
        <div
          aria-hidden
          className="bg-primary/20 pointer-events-none absolute -bottom-32 left-1/2 size-96 -translate-x-1/2 rounded-full blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-4">
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to unbox?
          </h2>
          <p className="text-muted-foreground max-w-md">
            Browse the full catalog and find your next favorite gadget.
          </p>
          <Button
            size="lg"
            render={<Link href="/products" />}
            nativeButton={false}
            data-icon="inline-end">
            Shop the catalog
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
