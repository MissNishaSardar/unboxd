"use client";

/* eslint-disable react-hooks/set-state-in-effect -- syncing debounced query to suggestion state is intentional */
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/shadcnui/input-group";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type {
  SearchSuggestionBrand,
  SearchSuggestionProduct,
} from "@/server/search";
import SearchAutocompleteDropdown from "@/components/Search/SearchAutocompleteDropdown";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onValueChange: (v: string) => void;
  onSubmit: (q: string) => void;
  variant: "dark" | "light";
  placeholder?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
};

const SearchAutocompleteInput = ({
  value,
  onValueChange,
  onSubmit,
  variant,
  placeholder = "Search for products, brands...",
  autoFocus,
  onNavigate,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [brandFilters, setBrandFilters] = useQueryStates(
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
  const navigateToBrand = (slug: string) => {
    const isActive = brandFilters.brands.includes(slug);
    const next =
      isActive ?
        brandFilters.brands.filter((s) => s !== slug)
      : [...brandFilters.brands, slug];
    if (pathname === "/products") {
      void setBrandFilters({ brands: next, page: null });
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (next.length > 0) params.set("brand", next.join(","));
      else params.delete("brand");
      params.delete("page");
      const qs = params.toString() ? `?${params.toString()}` : "";
      router.push(`/products${qs}` as never);
    }
  };
  const debounced = useDebouncedValue(value, 300);
  const [brands, setBrands] = useState<SearchSuggestionBrand[]>([]);
  const [products, setProducts] = useState<SearchSuggestionProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const q = debounced.trim();
  const shouldFetch = q.length >= 2;

  useEffect(() => {
    if (!shouldFetch) {
      setBrands([]);
      setProducts([]);
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        setBrands(data.brands ?? []);
        setProducts(data.products ?? []);
        setIsLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
      });
    return () => controller.abort();
  }, [q, shouldFetch]);

  const total = brands.length + products.length;
  const hasDropdown =
    open && (isLoading || total > 0 || (shouldFetch && !isLoading));

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const handleSelectViewAll = () => {
    setOpen(false);
    onSubmit(q);
    onNavigate?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hasDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % (total + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + total + 1) % (total + 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex <= total) {
        e.preventDefault();
        if (activeIndex < brands.length) {
          const b = brands[activeIndex];
          setOpen(false);
          onNavigate?.();
          navigateToBrand(b.slug);
        } else if (activeIndex < total) {
          const p = products[activeIndex - brands.length];
          setOpen(false);
          onNavigate?.();
          router.push(`/products/${p.slug}` as never);
        } else {
          handleSelectViewAll();
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const isDark = variant === "dark";

  return (
    <div
      ref={containerRef}
      className="relative w-full">
      <form
        role="search"
        aria-label="Site search"
        onSubmit={(e) => {
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex <= total && hasDropdown) {
            if (activeIndex < brands.length) {
              const b = brands[activeIndex];
              setOpen(false);
              onNavigate?.();
              navigateToBrand(b.slug);
              return;
            }
            if (activeIndex < total) {
              const p = products[activeIndex - brands.length];
              setOpen(false);
              onNavigate?.();
              router.push(`/products/${p.slug}` as never);
              return;
            }
          }
          setOpen(false);
          onSubmit(value);
          onNavigate?.();
        }}
        className="flex w-full items-center">
        <InputGroup
          className={cn(
            "h-9 flex-1 rounded-full backdrop-blur-sm transition-colors",
            isDark ?
              "border-white/10 bg-white/10 text-white focus-within:border-white/20 focus-within:ring-white/20"
            : "border-border/50 bg-background/60 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30 dark:bg-input/20 shadow-xs has-[[data-slot=input-group-control]:focus-visible]:ring-3",
          )}>
          <InputGroupAddon align="inline-start">
            <SearchIcon
              className={cn(
                "size-4",
                isDark ? "text-white/60" : "text-muted-foreground",
              )}
            />
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            type="text"
            inputMode="search"
            placeholder={placeholder}
            aria-label={placeholder}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => {
              onValueChange(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (value.trim().length >= 2) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              "search-cancel-hidden",
              isDark ?
                "text-white placeholder:text-white/40"
              : "placeholder:text-muted-foreground/70",
            )}
          />
          {value.length > 0 && (
            <InputGroupAddon
              align="inline-end"
              className="pr-1">
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  onValueChange("");
                  setBrands([]);
                  setProducts([]);
                  setOpen(false);
                  inputRef.current?.focus();
                }}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full",
                  isDark ?
                    "text-white/60 hover:bg-white/10 hover:text-white"
                  : "text-muted-foreground hover:bg-muted",
                )}>
                <XIcon className="size-3.5" />
              </button>
            </InputGroupAddon>
          )}
        </InputGroup>
      </form>

      {hasDropdown && (
        <SearchAutocompleteDropdown
          q={q}
          brands={brands}
          products={products}
          isLoading={isLoading}
          activeIndex={activeIndex}
          variant={variant}
          onSelect={() => {
            setOpen(false);
            onNavigate?.();
          }}
          setActiveIndex={setActiveIndex}
        />
      )}
    </div>
  );
};

export default SearchAutocompleteInput;
