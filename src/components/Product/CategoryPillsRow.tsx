"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/shadcnui/toggle-group";
import {
  ALL_CATEGORY,
  categoryIcons,
  FallbackIcon,
  type FilterCategory,
} from "@/components/Product/categoryFilterMeta";

const CategoryPillsRow = ({
  categories,
  navigateBasePath,
}: {
  categories: FilterCategory[];
  navigateBasePath?: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useQueryStates(
    {
      categories: parseAsArrayOf(parseAsString, ",").withDefault([]),
      category: parseAsString,
      brands: parseAsArrayOf(parseAsString, ",").withDefault([]),
      page: parseAsInteger,
    },
    {
      shallow: false,
      urlKeys: {
        categories: "categories",
        category: "category",
        brands: "brand",
      },
    },
  );
  const singleCategory = filters.category;
  const activeCategories = Array.from(
    new Set([
      ...filters.categories,
      ...(singleCategory ? [singleCategory] : []),
    ]),
  );

  const isAll = activeCategories.length === 0;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows, categories]);

  const scrollPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={updateArrows}
        aria-label="Categories"
        className="flex snap-x snap-mandatory scroll-px-4 scrollbar-none gap-2 overflow-x-auto pb-2">
        <ToggleGroup
          multiple
          orientation="horizontal"
          className="flex flex-nowrap gap-2"
          value={isAll ? [ALL_CATEGORY] : activeCategories}
          onValueChange={(values) => {
            if (navigateBasePath) {
              const pushTo = (cats: string[]) => {
                const params = new URLSearchParams(searchParams.toString());
                if (cats.length > 0) params.set("categories", cats.join(","));
                else params.delete("categories");
                params.delete("category");
                params.delete("page");
                const qs = params.toString() ? `?${params.toString()}` : "";
                router.push(`${navigateBasePath}${qs}` as never);
              };
              if (values.length === 0) {
                pushTo([]);
                return;
              }
              if (values.includes(ALL_CATEGORY)) {
                if (isAll) {
                  const next = values.filter((value) => value !== ALL_CATEGORY);
                  pushTo(next);
                  return;
                }
                pushTo([]);
                return;
              }
              const next = values.filter((value) => value !== ALL_CATEGORY);
              pushTo(next);
              return;
            }
            if (values.length === 0) {
              void setFilters({ categories: [], category: null, page: null });
              return;
            }
            if (values.includes(ALL_CATEGORY)) {
              if (isAll) {
                const next = values.filter((value) => value !== ALL_CATEGORY);
                void setFilters({
                  categories: next,
                  category: null,
                  page: null,
                });
                return;
              }
              void setFilters({ categories: [], category: null, page: null });
              return;
            }
            const next = values.filter((value) => value !== ALL_CATEGORY);
            void setFilters({ categories: next, category: null, page: null });
          }}>
          {(() => {
            const Icon = FallbackIcon;
            return (
              <ToggleGroupItem
                value={ALL_CATEGORY}
                variant="outline"
                className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground shrink-0 justify-between gap-1.5 rounded-full px-3">
                <span className="flex items-center gap-1.5">
                  <Icon className="size-3.5" />
                  <span className="text-xs font-medium">All</span>
                </span>
              </ToggleGroupItem>
            );
          })()}
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug] ?? FallbackIcon;
            return (
              <ToggleGroupItem
                key={category.slug}
                value={category.slug}
                variant="outline"
                className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground shrink-0 justify-between gap-1.5 rounded-full px-3">
                <span className="flex items-center gap-1.5">
                  <Icon className="size-3.5" />
                  <span className="text-xs font-medium">{category.name}</span>
                </span>
                <Badge
                  variant="outline"
                  className="shrink-0 border-current bg-transparent px-1.5 py-0 text-[10px] tabular-nums">
                  {category.count}
                </Badge>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>
      {canLeft && (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Scroll categories left"
          onClick={() => scrollPage(-1)}
          className="bg-card/95 absolute top-1/2 left-0 hidden -translate-y-1/2 rounded-full shadow-md backdrop-blur md:flex">
          <ChevronLeftIcon aria-hidden="true" />
        </Button>
      )}
      {canRight && (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Scroll categories right"
          onClick={() => scrollPage(1)}
          className="bg-card/95 absolute top-1/2 right-0 hidden -translate-y-1/2 rounded-full shadow-md backdrop-blur md:flex">
          <ChevronRightIcon aria-hidden="true" />
        </Button>
      )}
    </div>
  );
};

export default CategoryPillsRow;
