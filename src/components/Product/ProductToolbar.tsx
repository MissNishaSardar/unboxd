"use client";

import { XIcon } from "lucide-react";
import {
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import type { FilterCategory } from "@/components/Product/FilterSidebar";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
] as const;

type Props = {
  categories: FilterCategory[];
};

const ProductToolbar = ({ categories }: Props) => {
  const [filters, setFilters] = useQueryStates(
    {
      category: parseAsString,
      sort: parseAsString,
      min: parseAsFloat,
      max: parseAsFloat,
      page: parseAsInteger,
    },
    { shallow: false },
  );

  const sort = filters.sort ?? "newest";
  const activeCategory = filters.category ?? null;
  const activeMin = filters.min ?? null;
  const activeMax = filters.max ?? null;

  const hasCategory = activeCategory !== null && activeCategory !== "";
  const hasMin = activeMin !== null && activeMin !== undefined;
  const hasMax = activeMax !== null && activeMax !== undefined;
  const hasFilters = hasCategory || hasMin || hasMax;

  const categoryName =
    categories.find((c) => c.slug === activeCategory)?.name ?? activeCategory;

  const priceLabel =
    hasMin && hasMax ? `$${activeMin} – $${activeMax}`
    : hasMin ? `Min $${activeMin}`
    : hasMax ? `Max $${activeMax}`
    : null;

  const clearCategory = () => {
    void setFilters({ category: null, page: null });
  };

  const clearPrice = () => {
    void setFilters({ min: null, max: null, page: null });
  };

  const clearAll = () => {
    void setFilters({ category: null, min: null, max: null, page: null });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <Select
          value={sort}
          onValueChange={(value) =>
            void setFilters({ sort: value ?? null, page: null })
          }
          items={SORT_OPTIONS as unknown as { value: string; label: string }[]}>
          <SelectTrigger
            size="sm"
            className="w-full sm:w-48">
            <SelectValue>
              {SORT_OPTIONS.find((o) => o.value === sort)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SORT_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {hasCategory && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1">
              <span className="max-w-32 truncate">{categoryName}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${categoryName} filter`}
                onClick={clearCategory}
                className="size-5 rounded-full">
                <XIcon className="size-3" />
              </Button>
            </Badge>
          )}

          {priceLabel && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1">
              <span>{priceLabel}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Remove price filter"
                onClick={clearPrice}
                className="size-5 rounded-full">
                <XIcon className="size-3" />
              </Button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="xs"
            onClick={clearAll}
            className="h-6 px-2 text-xs">
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductToolbar;
