"use client";

import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
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

const CategoryPillsRow = ({ categories }: { categories: FilterCategory[] }) => {
  const [filters, setFilters] = useQueryStates(
    {
      categories: parseAsArrayOf(parseAsString, ",").withDefault([]),
      page: parseAsInteger,
    },
    {
      shallow: false,
      urlKeys: { categories: "categories" },
    },
  );
  const activeCategories = filters.categories;

  const isAll = activeCategories.length === 0;

  return (
    <div
      aria-label="Categories"
      className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
      <ToggleGroup
        multiple
        orientation="horizontal"
        className="flex flex-nowrap gap-2"
        value={isAll ? [ALL_CATEGORY] : activeCategories}
        onValueChange={(values) => {
          if (values.length === 0) {
            void setFilters({ categories: [], page: null });
            return;
          }
          if (values.includes(ALL_CATEGORY)) {
            if (isAll) {
              const next = values.filter((value) => value !== ALL_CATEGORY);
              void setFilters({ categories: next, page: null });
              return;
            }
            void setFilters({ categories: [], page: null });
            return;
          }
          const next = values.filter((value) => value !== ALL_CATEGORY);
          void setFilters({ categories: next, page: null });
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
