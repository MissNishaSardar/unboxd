"use client";

import { PackageSearchIcon } from "lucide-react";
import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { Button } from "@/components/shadcnui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";

const ProductsEmpty = () => {
  const [filters, setFilters] = useQueryStates(
    {
      categories: parseAsArrayOf(parseAsString, ",").withDefault([]),
      min: parseAsFloat,
      max: parseAsFloat,
      page: parseAsInteger,
    },
    { shallow: false, urlKeys: { categories: "categories" } },
  );

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.min !== null ||
    filters.max !== null;

  const handleClear = () => {
    void setFilters({ categories: [], min: null, max: null, page: null });
  };

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackageSearchIcon />
        </EmptyMedia>
        <EmptyTitle>No products found</EmptyTitle>
        <EmptyDescription>
          {hasActiveFilters ?
            "No products match these filters. Try clearing filters or widening the price range."
          : "No products are available right now. Check back soon."}
        </EmptyDescription>
      </EmptyHeader>
      {hasActiveFilters && (
        <EmptyContent>
          <Button
            variant="outline"
            onClick={handleClear}>
            Clear filters
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
};

export default ProductsEmpty;
