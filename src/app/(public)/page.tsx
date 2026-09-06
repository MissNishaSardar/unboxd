import HeroCarousel from "@/components/Home/HeroCarousel";
import PerksRow from "@/components/Home/PerksRow";
import CategoryPillsRow from "@/components/Product/CategoryPillsRow";
import ProductGrid from "@/components/Product/ProductGrid";
import ProductCard from "@/components/Product/ProductCard";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { getCategoriesWithCounts, getFeaturedProducts } from "@/server/catalog";
import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Unboxd | Electronics, Unboxed",
  },
  description:
    "Shop smartphones, laptops, audio, and accessories with fast COD delivery.",
};

const HomePage = async () => {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategoriesWithCounts(),
  ]);

  return (
    <div className="-mt-8 flex flex-col gap-10 lg:gap-16">
      <div className="flex flex-col gap-3">
        <CategoryPillsRow
          categories={categories}
          navigateBasePath="/products"
        />

        <div className="relative right-1/2 left-1/2 -mx-[50vw] w-screen">
          <HeroCarousel products={featured} />
        </div>
      </div>

      <PerksRow />

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
        {featured.length > 0 ?
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
              />
            ))}
          </div>
        : <ProductGrid products={featured} />}
      </section>

      <section className="border-border bg-card relative grid overflow-hidden rounded-3xl border p-6 md:p-10 lg:grid-cols-2 lg:gap-6">
        <div
          className="bg-primary/20 pointer-events-none absolute -bottom-32 left-1/2 hidden size-96 -translate-x-1/2 rounded-full blur-3xl md:block"
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-start gap-4 lg:justify-center">
          <Badge variant="secondary">Ready to unbox</Badge>
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to unbox?
          </h2>
          <p className="text-muted-foreground max-w-md">
            Browse the full catalog and find your next favorite gadget. Cash on
            delivery and tracked delivery across India.
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
        <div className="relative mt-6 grid grid-cols-3 gap-3 lg:mt-0">
          {featured.slice(1, 4).map((product, i) => (
            <div
              key={product.slug}
              className={`bg-muted aspect-square overflow-hidden rounded-2xl ${i === 1 ? "translate-y-3" : ""} ${
                i === 2 ? "-rotate-2"
                : i === 0 ? "rotate-2"
                : ""
              }`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[0]?.url ?? "/placeholder.svg"}
                alt={product.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
