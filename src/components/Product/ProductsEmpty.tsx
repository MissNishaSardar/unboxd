"use client";

import { PackageSearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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

const ProductsEmpty = ({ query }: { query?: string }) => {
  const router = useRouter();
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

  const trimmedQuery = query?.trim();
  const hasQuery = Boolean(trimmedQuery);

  const handleClear = () => {
    void setFilters({ categories: [], min: null, max: null, page: null });
  };

  const handleClearSearch = () => {
    router.push("/products");
  };

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackageSearchIcon />
        </EmptyMedia>
        <EmptyTitle>
          {hasQuery ? `No results for "${trimmedQuery}"` : "No products found"}
        </EmptyTitle>
        <EmptyDescription>
          {hasQuery ?
            "No products match your search. Try a shorter term or check spelling."
          : hasActiveFilters ?
            "No products match these filters. Try clearing filters or widening the price range."
          : "No products are available right now. Check back soon."}
        </EmptyDescription>
      </EmptyHeader>
      {hasQuery ?
        <EmptyContent>
          <Button
            variant="outline"
            onClick={handleClearSearch}>
            Clear search
          </Button>
        </EmptyContent>
      : hasActiveFilters && (
          <EmptyContent>
            <Button
              variant="outline"
              onClick={handleClear}>
              Clear filters
            </Button>
          </EmptyContent>
        )
      }
    </Empty>
  );
};

export default ProductsEmpty;
