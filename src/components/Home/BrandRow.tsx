import type { BrandWithCount } from "@/server/brands";
import Link from "next/link";

const BrandRow = ({ brands }: { brands: BrandWithCount[] }) => {
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
        {display.map((brand) => (
          <Link
            key={brand.slug}
            href={{ pathname: "/products", query: { brand: brand.slug } }}
            className="border-border bg-card hover:bg-muted inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors">
            <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
              {brand.name.slice(0, 1).toUpperCase()}
            </span>
            {brand.name}
            <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0 text-[10px] tabular-nums">
              {brand.count}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BrandRow;
