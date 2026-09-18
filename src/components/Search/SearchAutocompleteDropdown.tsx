"use client";

import Link from "next/link";
import { SearchIcon, TagIcon, BadgeCheckIcon } from "lucide-react";
import type {
  SearchSuggestionBrand,
  SearchSuggestionProduct,
} from "@/server/search";
import { resolveProductImageUrl } from "@/lib/placeholder";
import { cn } from "@/lib/utils";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  q: string;
  brands: SearchSuggestionBrand[];
  products: SearchSuggestionProduct[];
  isLoading: boolean;
  activeIndex: number;
  variant: "dark" | "light";
  onSelect: () => void;
  setActiveIndex: (i: number) => void;
};

function highlight(text: string, q: string) {
  const trimmed = q.trim();
  if (!trimmed) return text;
  const idx = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-semibold text-inherit underline decoration-white/20 underline-offset-2">
        {text.slice(idx, idx + trimmed.length)}
      </mark>
      {text.slice(idx + trimmed.length)}
    </>
  );
}

const SearchAutocompleteDropdown = ({
  q,
  brands,
  products,
  isLoading,
  activeIndex,
  variant,
  onSelect,
  setActiveIndex,
}: Props) => {
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

  const handleBrandClick = (slug: string) => {
    onSelect();
    const isActive = filters.brands.includes(slug);
    const next =
      isActive ?
        filters.brands.filter((s) => s !== slug)
      : [...filters.brands, slug];
    if (pathname === "/products") {
      void setFilters({ brands: next, page: null });
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (next.length > 0) params.set("brand", next.join(","));
      else params.delete("brand");
      params.delete("page");
      const qs = params.toString() ? `?${params.toString()}` : "";
      router.push(`/products${qs}` as never);
    }
  };

  const isDark = variant === "dark";
  const total = brands.length + products.length;
  const hasResults = total > 0;
  const viewAllIndex = total;

  const containerClass = cn(
    "absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-2xl border shadow-xl backdrop-blur-xl",
    isDark ?
      "border-white/10 bg-[rgba(15,15,20,0.98)] text-white"
    : "bg-popover border-border text-foreground",
  );

  if (isLoading) {
    return (
      <div className={containerClass}>
        <div className="p-3">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-12 animate-pulse rounded-xl",
                  isDark ? "bg-white/5" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className={containerClass}>
        <div
          className={cn(
            "p-4 text-center text-sm",
            isDark ? "text-white/60" : "text-muted-foreground",
          )}>
          No results for{" "}
          <span className={isDark ? "text-white" : "text-foreground"}>{q}</span>
          <div className="mt-3">
            <Link
              href={`/search?q=${encodeURIComponent(q)}` as never}
              onClick={onSelect}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                isDark ?
                  "bg-white text-black hover:bg-white/90"
                : "bg-foreground text-background hover:bg-foreground/90",
              )}>
              <SearchIcon className="size-3.5" />
              Search for {q}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
        {brands.length > 0 && (
          <div className="mb-1">
            <p
              className={cn(
                "px-3 py-1 text-[11px] font-semibold tracking-widest uppercase",
                isDark ? "text-white/40" : "text-muted-foreground",
              )}>
              Brands
            </p>
            {brands.map((brand, i) => {
              const idx = i;
              const active = idx === activeIndex;
              return (
                <button
                  key={brand.slug}
                  type="button"
                  onClick={() => handleBrandClick(brand.slug)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    active ?
                      isDark ? "bg-white/10 text-white"
                      : "bg-muted text-foreground"
                    : isDark ? "text-white/90 hover:bg-white/5"
                    : "hover:bg-muted",
                  )}>
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      isDark ?
                        "bg-white/10 text-white"
                      : "bg-muted text-muted-foreground",
                      active && isDark ? "bg-white/15" : "",
                    )}>
                    <TagIcon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {highlight(brand.name, q)}
                  </span>
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      isDark ? "text-white/50" : "text-muted-foreground",
                    )}>
                    {brand.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {products.length > 0 && (
          <div>
            <p
              className={cn(
                "px-3 py-1 text-[11px] font-semibold tracking-widest uppercase",
                isDark ? "text-white/40" : "text-muted-foreground",
              )}>
              Products
            </p>
            {products.map((product, i) => {
              const idx = brands.length + i;
              const active = idx === activeIndex;
              const price = product.price;
              return (
                <Link
                  key={product.slug}
                  href={`/products/${product.slug}` as never}
                  onClick={onSelect}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-2 py-2 transition-colors",
                    active ?
                      isDark ? "bg-white/10"
                      : "bg-muted"
                    : isDark ? "hover:bg-white/5"
                    : "hover:bg-muted",
                  )}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveProductImageUrl(
                      product.images[0]?.url ?? "",
                      product.slug,
                      0,
                    )}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 shrink-0 rounded-lg object-cover"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={cn(
                        "truncate text-sm font-medium",
                        isDark ? "text-white" : "text-foreground",
                      )}>
                      {highlight(product.name, q)}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1 truncate text-xs",
                        isDark ? "text-white/50" : "text-muted-foreground",
                      )}>
                      {product.brand}
                      <BadgeCheckIcon
                        aria-label="Verified brand"
                        className="size-3 shrink-0 fill-sky-500 text-white"
                      />
                      <span className="truncate">
                        • Rs. {price.toLocaleString("en-IN")}
                      </span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div
        className={cn(
          "border-t p-2",
          isDark ? "border-white/10" : "border-border",
        )}>
        <Link
          href={`/search?q=${encodeURIComponent(q)}` as never}
          onClick={onSelect}
          onMouseEnter={() => setActiveIndex(viewAllIndex)}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            viewAllIndex === activeIndex ?
              isDark ? "bg-white text-black"
              : "bg-foreground text-background"
            : isDark ? "bg-white/5 text-white hover:bg-white/10"
            : "bg-muted hover:bg-muted/80",
          )}>
          <SearchIcon className="size-4" />
          View all results for {q}
        </Link>
      </div>
    </div>
  );
};

export default SearchAutocompleteDropdown;
