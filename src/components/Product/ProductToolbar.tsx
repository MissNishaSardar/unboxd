"use client";

/* eslint-disable react-hooks/set-state-in-effect -- syncing URL query state to draft inputs for popover is intentional */
import { useEffect, useState } from "react";
import { CheckIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { Field, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcnui/popover";
import type { FilterCategory } from "@/components/Product/categoryFilterMeta";
import type { BrandWithCount } from "@/server/brands";

type Props = {
  categories: FilterCategory[];
  brands?: BrandWithCount[];
  total: number;
};

const PRICE_PRESETS = [
  { label: "Under ₹5,000", min: null, max: 4999 },
  { label: "₹5,000 to ₹50,000", min: 5000, max: 50000 },
  { label: "Above ₹50,000", min: 50001, max: null },
] as const;

const ProductToolbar = ({ categories, brands, total }: Props) => {
  // sort lives in ProductSortMenu, this deck row owns filters and chips only
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString,
      categories: parseAsArrayOf(parseAsString, ",").withDefault([]),
      category: parseAsString,
      brands: parseAsArrayOf(parseAsString, ",").withDefault([]),
      sale: parseAsBoolean,
      stock: parseAsBoolean,
      min: parseAsFloat,
      max: parseAsFloat,
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

  const saleOn = filters.sale ?? false;
  const stockOn = filters.stock ?? false;

  const singleCategory = filters.category;
  const activeCategories = Array.from(
    new Set([
      ...filters.categories,
      ...(singleCategory ? [singleCategory] : []),
    ]),
  );
  const activeBrands = filters.brands;
  const activeMin = filters.min ?? null;
  const activeMax = filters.max ?? null;
  const activeQ = filters.q ?? null;

  const hasCategories = activeCategories.length > 0;
  const hasBrands = activeBrands.length > 0;
  const hasMin = activeMin !== null && activeMin !== undefined;
  const hasMax = activeMax !== null && activeMax !== undefined;
  const hasQ = activeQ !== null && activeQ !== "";
  const hasFilters =
    hasCategories || hasBrands || hasMin || hasMax || hasQ || saleOn || stockOn;

  const priceLabel =
    hasMin && hasMax ?
      `₹${activeMin?.toLocaleString()} to ₹${activeMax?.toLocaleString()}`
    : hasMin ? `Min ₹${activeMin?.toLocaleString()}`
    : hasMax ? `Max ₹${activeMax?.toLocaleString()}`
    : null;

  const removeCategory = (slug: string) => {
    const nextCategories = activeCategories.filter((item) => item !== slug);
    // nuqs stores singular ?category and plural ?categories separately,
    // keep both in sync when hero lands with a category query value
    const nextCategory =
      singleCategory === slug ? null : (singleCategory ?? null);
    // if we removed the singular alias and kept the array, write both
    const filteredPlural = filters.categories.filter((item) => item !== slug);
    const keepSingular = nextCategory !== null ? nextCategory : null;
    // when only singular existed, move remaining to plural to avoid alias drift
    if (filters.categories.length === 0 && singleCategory) {
      void setFilters({
        categories: nextCategories.filter((c) => c !== singleCategory),
        category: keepSingular,
        page: null,
      });
      return;
    }
    void setFilters({
      categories: filteredPlural,
      category: keepSingular,
      page: null,
    });
  };

  const removeBrand = (slug: string) => {
    void setFilters({
      brands: activeBrands.filter((item) => item !== slug),
      page: null,
    });
  };

  const clearPrice = () => {
    void setFilters({ min: null, max: null, page: null });
  };

  const clearQ = () => {
    void setFilters({ q: null, page: null });
  };

  const clearAll = () => {
    void setFilters({
      q: null,
      categories: [],
      category: null,
      brands: [],
      sale: null,
      stock: null,
      min: null,
      max: null,
      page: null,
    });
  };

  const [open, setOpen] = useState(false);
  const [draftMin, setDraftMin] = useState(
    filters.min != null ? String(filters.min) : "",
  );
  const [draftMax, setDraftMax] = useState(
    filters.max != null ? String(filters.max) : "",
  );

  useEffect(() => {
    if (open) return;
    setDraftMin(filters.min != null ? String(filters.min) : "");
    setDraftMax(filters.max != null ? String(filters.max) : "");
  }, [filters.min, filters.max, open]);

  const handleApply = () => {
    const parsedMin = draftMin === "" ? null : Number(draftMin);
    const parsedMax = draftMax === "" ? null : Number(draftMax);
    if (draftMin !== "" && Number.isNaN(parsedMin)) return;
    if (draftMax !== "" && Number.isNaN(parsedMax)) return;
    const nextMin =
      parsedMin !== null && !Number.isNaN(parsedMin) ? parsedMin : null;
    const nextMax =
      parsedMax !== null && !Number.isNaN(parsedMax) ? parsedMax : null;
    void setFilters({
      min: nextMin,
      max: nextMax,
      page: null,
    });
    setOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
      <Popover
        open={open}
        onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full"
            />
          }>
          <SlidersHorizontalIcon className="size-4" />
          Filter by
        </PopoverTrigger>
        <PopoverContent
          align="center"
          sideOffset={8}
          className="w-80 max-w-[calc(100vw-24px)] p-0">
          <Card
            size="sm"
            className="border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Filters</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium">Availability</span>
                <button
                  type="button"
                  onClick={() => {
                    void setFilters({ sale: saleOn ? null : true, page: null });
                  }}
                  className="hover:bg-accent flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left">
                  <span className="flex flex-col items-start leading-none">
                    <span className="text-xs font-medium">On sale</span>
                    <span className="text-muted-foreground mt-1 text-[11px] font-normal">
                      Items with an active deal
                    </span>
                  </span>
                  {saleOn && (
                    <CheckIcon className="text-primary ml-auto size-3.5 shrink-0" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void setFilters({
                      stock: stockOn ? null : true,
                      page: null,
                    });
                  }}
                  className="hover:bg-accent flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left">
                  <span className="flex flex-col items-start leading-none">
                    <span className="text-xs font-medium">In stock</span>
                    <span className="text-muted-foreground mt-1 text-[11px] font-normal">
                      Has variants in stock
                    </span>
                  </span>
                  {stockOn && (
                    <CheckIcon className="text-primary ml-auto size-3.5 shrink-0" />
                  )}
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium">Price</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_PRESETS.map((preset) => {
                    const presetMin = preset.min;
                    const presetMax = preset.max;
                    const isOn =
                      activeMin === presetMin && activeMax === presetMax;
                    return (
                      <Button
                        key={preset.label}
                        type="button"
                        variant={isOn ? "secondary" : "outline"}
                        size="xs"
                        className="rounded-full text-xs"
                        onClick={() => {
                          void setFilters({
                            min: presetMin,
                            max: presetMax,
                            page: null,
                          });
                        }}>
                        {preset.label}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Field className="flex-1">
                    <FieldLabel htmlFor="filter-min">Min</FieldLabel>
                    <Input
                      id="filter-min"
                      type="number"
                      placeholder="Min"
                      value={draftMin}
                      onChange={(e) => setDraftMin(e.target.value)}
                    />
                  </Field>
                  <Field className="flex-1">
                    <FieldLabel htmlFor="filter-max">Max</FieldLabel>
                    <Input
                      id="filter-max"
                      type="number"
                      placeholder="Max"
                      value={draftMax}
                      onChange={(e) => setDraftMax(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={handleApply}>
                Apply
              </Button>
              {(hasMin || hasMax) && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    void setFilters({ min: null, max: null, page: null });
                    setOpen(false);
                  }}>
                  Clear price
                </Button>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {hasQ && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1">
          <span className="max-w-32 truncate">q: {activeQ}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Remove search filter"
            onClick={clearQ}
            className="size-5 rounded-full">
            <XIcon className="size-3" />
          </Button>
        </Badge>
      )}
      {activeCategories.map((slug) => {
        const name =
          categories.find((item) => item.slug === slug)?.name ?? slug;
        return (
          <Badge
            key={slug}
            variant="secondary"
            className="gap-1 pr-1">
            <span className="max-w-32 truncate">{name}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove ${name} filter`}
              onClick={() => removeCategory(slug)}
              className="size-5 rounded-full">
              <XIcon className="size-3" />
            </Button>
          </Badge>
        );
      })}
      {activeBrands.map((slug) => {
        const name = brands?.find((item) => item.slug === slug)?.name ?? slug;
        return (
          <Badge
            key={slug}
            variant="secondary"
            className="gap-1 pr-1">
            <span className="max-w-32 truncate">{name}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove ${name} filter`}
              onClick={() => removeBrand(slug)}
              className="size-5 rounded-full">
              <XIcon className="size-3" />
            </Button>
          </Badge>
        );
      })}
      {saleOn && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1">
          <span>On sale</span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Remove sale filter"
            onClick={() => {
              void setFilters({ sale: null, page: null });
            }}
            className="size-5 rounded-full">
            <XIcon className="size-3" />
          </Button>
        </Badge>
      )}
      {stockOn && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1">
          <span>In stock</span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Remove stock filter"
            onClick={() => {
              void setFilters({ stock: null, page: null });
            }}
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

      <span className="text-muted-foreground ml-auto text-xs tabular-nums">
        {total === 0 ? "No items" : `${total} item${total === 1 ? "" : "s"}`}
      </span>
      {hasFilters && (
        <Button
          variant="ghost"
          size="xs"
          onClick={clearAll}
          className="-mr-1 text-xs">
          Clear all
        </Button>
      )}
    </div>
  );
};

export default ProductToolbar;
