"use client";

import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/shadcnui/badge";
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
  const activeBrands = filters.brands;

  const isAll = activeCategories.length === 0;

  return (
    <div
      aria-label="Categories"
      className="[&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-foreground/20 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:thin] [scrollbar-color:oklch(0.92_0.004_286.32)_transparent] gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full">
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
              void setFilters({ categories: next, category: null, page: null });
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
  );
};

export default CategoryPillsRow;
