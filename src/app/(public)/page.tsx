import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/shadcnui/badge";
import ProductGrid from "@/components/product/product-grid";
import { getCategoriesWithCounts, getFeaturedProducts } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Unboxd — Electronics, Unboxed",
  description:
    "Shop smartphones, laptops, audio, and accessories with fast COD delivery.",
};

const HomePage = async () => {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategoriesWithCounts(),
  ]);

  return (
    <div className="flex flex-col gap-12 px-6 py-10">
      <section className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          Electronics, unboxed
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Latest smartphones, laptops, audio gear, and accessories. Order with
          cash on delivery and unbox it the same week.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-medium">Shop by category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={{
                pathname: "/products",
                query: { category: category.slug },
              }}
              className="transition-opacity hover:opacity-75">
              <Badge
                variant="secondary"
                className="gap-2 px-3 py-1.5 text-sm">
                {category.name}
                <span className="text-muted-foreground tabular-nums">
                  {category.count}
                </span>
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-medium">Featured</h2>
        <ProductGrid products={featured} />
      </section>
    </div>
  );
};

export default HomePage;
