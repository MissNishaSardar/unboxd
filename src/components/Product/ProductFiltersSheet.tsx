"use client";

/* eslint-disable react-hooks/set-state-in-effect -- syncing URL query state to local inputs/slider is intentional */
import { useState } from "react";
import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/shadcnui/sheet";
import { Slider } from "@/components/shadcnui/slider";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/shadcnui/toggle-group";
import type { FilterCategory } from "@/components/Product/categoryFilterMeta";
import {
  ALL_CATEGORY,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  categoryIcons,
  FallbackIcon,
} from "@/components/Product/categoryFilterMeta";
import { SlidersHorizontalIcon, TagIcon } from "lucide-react";
import { useEffect, useRef } from "react";

const categoryGroups: { label: string; slugs: string[] }[] = [
  { label: "Phones", slugs: ["smartphones"] },
  { label: "Laptops", slugs: ["laptops", "gaming-laptops"] },
  { label: "Audio", slugs: ["headphones", "earbuds", "speakers"] },
  { label: "Accessories", slugs: ["chargers-cables", "cases-protection"] },
];

const ProductFiltersSheet = ({
  categories,
}: {
  categories: FilterCategory[];
}) => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useQueryStates(
    {
      categories: parseAsArrayOf(parseAsString, ",").withDefault([]),
      min: parseAsFloat,
      max: parseAsFloat,
      page: parseAsInteger,
    },
    { shallow: false, urlKeys: { categories: "categories" } },
  );

  const activeCategories = filters.categories;
  const activeCount =
    activeCategories.length +
    (filters.min != null ? 1 : 0) +
    (filters.max != null ? 1 : 0);

  const [min, setMin] = useState(
    filters.min != null ? String(filters.min) : "",
  );
  const [max, setMax] = useState(
    filters.max != null ? String(filters.max) : "",
  );
  const [sliderValues, setSliderValues] = useState<[number, number]>([
    filters.min ?? PRICE_MIN,
    filters.max ?? PRICE_MAX,
  ]);
  const isSyncing = useRef(false);

  useEffect(() => {
    isSyncing.current = true;
    setMin(filters.min != null ? String(filters.min) : "");
    setMax(filters.max != null ? String(filters.max) : "");
    setSliderValues([filters.min ?? PRICE_MIN, filters.max ?? PRICE_MAX]);
    const t = setTimeout(() => {
      isSyncing.current = false;
    }, 0);
    return () => clearTimeout(t);
  }, [filters.min, filters.max]);

  useEffect(() => {
    if (isSyncing.current) return;
    const timeout = setTimeout(() => {
      const parsedMin = min === "" ? null : Number(min);
      const parsedMax = max === "" ? null : Number(max);
      if (min !== "" && Number.isNaN(parsedMin)) return;
      if (max !== "" && Number.isNaN(parsedMax)) return;
      const nextMin =
        parsedMin !== null && !Number.isNaN(parsedMin) ? parsedMin : null;
      const nextMax =
        parsedMax !== null && !Number.isNaN(parsedMax) ? parsedMax : null;
      if (
        nextMin !== (filters.min ?? null) ||
        nextMax !== (filters.max ?? null)
      ) {
        void setFilters({ min: nextMin, max: nextMax, page: null });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [min, max, filters.min, filters.max, setFilters]);

  const selectCategories = (next: string[]) => {
    void setFilters({ categories: next, page: null });
    if (next.length === 0 || next.length < activeCategories.length)
      setOpen(false);
  };

  const isAll = activeCategories.length === 0;
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const ungrouped = categories.filter(
    (c) => !categoryGroups.some((g) => g.slugs.includes(c.slug)),
  );
  const renderPill = (category: FilterCategory) => {
    const Icon = categoryIcons[category.slug] ?? FallbackIcon;
    return (
      <ToggleGroupItem
        key={category.slug}
        value={category.slug}
        variant="outline"
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary justify-between gap-1.5 rounded-full px-3">
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
  };

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full lg:hidden"
          />
        }>
        <SlidersHorizontalIcon className="size-4" />
        Filters
        {activeCount > 0 && (
          <Badge
            variant="secondary"
            className="ml-1 h-5 min-w-5 px-1 tabular-nums">
            {activeCount}
          </Badge>
        )}
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[320px] overflow-y-auto p-4">
        <SheetHeader className="p-0">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 pt-4">
          <FieldGroup className="gap-6">
            <Field>
              <FieldTitle>Category</FieldTitle>
              <div className="flex flex-col gap-4">
                <ToggleGroup
                  multiple
                  orientation="vertical"
                  className="w-full gap-2"
                  value={isAll ? [ALL_CATEGORY] : []}
                  onValueChange={(values) => {
                    if (values.includes(ALL_CATEGORY)) {
                      selectCategories([]);
                      return;
                    }
                    if (values.length === 0) {
                      selectCategories([]);
                      return;
                    }
                    selectCategories(
                      values.filter((value) => value !== ALL_CATEGORY),
                    );
                  }}>
                  <ToggleGroupItem
                    value={ALL_CATEGORY}
                    variant="outline"
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary justify-between gap-1.5 rounded-full px-3">
                    <span className="flex items-center gap-1.5">
                      <TagIcon className="size-3.5" />
                      <span className="text-xs font-medium">All</span>
                    </span>
                  </ToggleGroupItem>
                </ToggleGroup>

                <ToggleGroup
                  multiple
                  orientation="vertical"
                  className="w-full flex-col items-stretch gap-4"
                  value={activeCategories}
                  onValueChange={(values) => {
                    const next = values.filter(
                      (value) => value !== ALL_CATEGORY,
                    );
                    selectCategories(next);
                  }}>
                  {categoryGroups.map((group) => {
                    const groupCats = group.slugs
                      .map((slug) => categoryBySlug.get(slug))
                      .filter((c): c is FilterCategory => Boolean(c));
                    if (groupCats.length === 0) return null;
                    return (
                      <div
                        key={group.label}
                        className="flex flex-col gap-2">
                        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                          {group.label}
                        </span>
                        <div className="flex flex-col gap-2">
                          {groupCats.map((c) => renderPill(c))}
                        </div>
                      </div>
                    );
                  })}
                  {ungrouped.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {ungrouped.map((c) => renderPill(c))}
                    </div>
                  )}
                </ToggleGroup>
              </div>
            </Field>
            <Field>
              <FieldTitle>Price range</FieldTitle>
              <div className="px-1 py-2">
                <Slider
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={sliderValues}
                  onValueChange={(v) => {
                    const arr = v as readonly number[];
                    setSliderValues([arr[0] ?? PRICE_MIN, arr[1] ?? PRICE_MAX]);
                  }}
                  onValueCommitted={(v) => {
                    const arr = v as readonly number[];
                    const rawMin = arr[0] ?? PRICE_MIN;
                    const rawMax = arr[1] ?? PRICE_MAX;
                    const nextMin = rawMin <= PRICE_MIN ? null : rawMin;
                    const nextMax = rawMax >= PRICE_MAX ? null : rawMax;
                    isSyncing.current = true;
                    setMin(nextMin === null ? "" : String(nextMin));
                    setMax(nextMax === null ? "" : String(nextMax));
                    setSliderValues([rawMin, rawMax]);
                    void setFilters({ min: nextMin, max: nextMax, page: null });
                    setTimeout(() => {
                      isSyncing.current = false;
                    }, 0);
                  }}
                />
                <div className="text-muted-foreground mt-2 flex justify-between text-xs tabular-nums">
                  <span>₹{sliderValues[0].toLocaleString()}</span>
                  <span>₹{sliderValues[1].toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Field className="min-w-0 flex-1">
                  <FieldLabel
                    htmlFor="sheet-min"
                    className="sr-only">
                    Minimum
                  </FieldLabel>
                  <Input
                    id="sheet-min"
                    type="number"
                    placeholder="Min"
                    value={min}
                    onChange={(e) => setMin(e.target.value)}
                  />
                </Field>
                <Field className="min-w-0 flex-1">
                  <FieldLabel
                    htmlFor="sheet-max"
                    className="sr-only">
                    Maximum
                  </FieldLabel>
                  <Input
                    id="sheet-max"
                    type="number"
                    placeholder="Max"
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                  />
                </Field>
              </div>
            </Field>
          </FieldGroup>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProductFiltersSheet;
