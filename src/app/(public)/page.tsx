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
import { resolveProductImageUrl } from "@/lib/placeholder";

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
      <div className="reveal flex flex-col gap-3">
        <CategoryPillsRow
          categories={categories}
          navigateBasePath="/products"
        />

        <div className="relative right-1/2 left-1/2 -mx-[50vw] w-screen max-w-[100vw]">
          <HeroCarousel products={featured} />
        </div>
      </div>

      <div className="reveal reveal-1">
        <PerksRow />
      </div>

      <section className="reveal reveal-2 flex flex-col gap-6">
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

      <section className="reveal reveal-3 border-border bg-card relative grid overflow-hidden rounded-3xl border p-6 md:p-10 lg:grid-cols-2 lg:gap-6">
        <div
          aria-hidden="true"
          className="texture-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_80%_at_50%_20%,black,transparent)] opacity-60"
        />
        <div
          className="bg-primary/15 pointer-events-none absolute -bottom-32 left-1/4 hidden size-96 rounded-full blur-3xl md:block"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-24 right-1/4 hidden size-64 rounded-full bg-amber-500/10 blur-3xl md:block"
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-start gap-4 lg:justify-center">
          <Badge variant="secondary">Shop the full catalog</Badge>
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Browse the catalog
          </h2>
          <p className="text-muted-foreground max-w-md">
            The full catalog is open. Cash on delivery with tracked shipping
            across India.
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
                src={resolveProductImageUrl(
                  product.images[0]?.url ?? "",
                  product.slug,
                  0,
                )}
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
