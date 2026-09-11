"use client";

import type { BrandWithCount } from "@/server/brands";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const BrandRow = ({ brands }: { brands: BrandWithCount[] }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useQueryStates(
    {
      brands: parseAsArrayOf(parseAsString, ",").withDefault([]),
      categories: parseAsArrayOf(parseAsString, ",").withDefault([]),
      category: parseAsString,
      page: parseAsInteger,
    },
    {
      shallow: false,
      urlKeys: {
        brands: "brand",
        categories: "categories",
        category: "category",
      },
    },
  );
  const activeBrands = filters.brands;

  const toggleBrand = (slug: string) => {
    const isActive = activeBrands.includes(slug);
    const nextBrands =
      isActive ?
        activeBrands.filter((s) => s !== slug)
      : [...activeBrands, slug];
    if (pathname === "/products") {
      void setFilters({ brands: nextBrands, page: null });
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (nextBrands.length > 0) params.set("brand", nextBrands.join(","));
      else params.delete("brand");
      params.delete("page");
      const qs = params.toString() ? `?${params.toString()}` : "";
      router.push(`/products${qs}` as never);
    }
  };

  if (brands.length === 0) return null;

  const display = brands.slice(0, 12);

  return (
    <section
      aria-label="Shop by brand"
      className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          Shop by brand
        </h2>
        <Link
          href="/products"
          className="text-muted-foreground hover:text-foreground text-xs font-medium">
          View all
        </Link>
      </div>
      <div className="[&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-foreground/20 flex [scrollbar-width:thin] [scrollbar-color:oklch(0.92_0.004_286.32)_transparent] gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {display.map((brand) => {
          const isActive = activeBrands.includes(brand.slug);
          return (
            <button
              key={brand.slug}
              type="button"
              aria-pressed={isActive}
              onClick={() => toggleBrand(brand.slug)}
              className={
                isActive ?
                  "border-primary bg-primary text-primary-foreground inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
                : "border-border bg-card hover:bg-muted inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
              }>
              <span
                className={
                  isActive ?
                    "flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold"
                  : "bg-muted flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                }>
                {brand.name.slice(0, 1).toUpperCase()}
              </span>
              {brand.name}
              <span
                className={
                  isActive ?
                    "rounded-full bg-white/20 px-1.5 py-0 text-[10px] tabular-nums"
                  : "bg-muted text-muted-foreground rounded-full px-1.5 py-0 text-[10px] tabular-nums"
                }>
                {brand.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default BrandRow;
