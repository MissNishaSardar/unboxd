"use client";

import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const useBrandFilters = () => {
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

  const toggleBrand = (slug: string, onClose?: () => void) => {
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
    onClose?.();
  };

  return {
    activeBrands,
    toggleBrand,
    filters,
    setFilters,
    searchParams,
    pathname,
    router,
  };
};
