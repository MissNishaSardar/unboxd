"use client";

/* eslint-disable react-hooks/set-state-in-effect -- syncing URL query state to local inputs/slider is intentional */

import { useEffect, useRef, useState } from "react";
import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { Badge } from "@/components/shadcnui/badge";
import { Card } from "@/components/shadcnui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { Slider } from "@/components/shadcnui/slider";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/shadcnui/toggle-group";
import {
  ALL_CATEGORY,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  categoryIcons,
  FallbackIcon,
  type FilterCategory,
} from "@/components/Product/categoryFilterMeta";
import { TagIcon } from "lucide-react";

const categoryGroups: { label: string; slugs: string[] }[] = [
  { label: "Phones", slugs: ["smartphones"] },
  { label: "Laptops", slugs: ["laptops", "gaming-laptops"] },
  { label: "Audio", slugs: ["headphones", "earbuds", "speakers"] },
  { label: "Accessories", slugs: ["chargers-cables", "cases-protection"] },
];

const FilterSidebar = ({ categories }: { categories: FilterCategory[] }) => {
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
  const [min, setMin] = useState(
    filters.min !== undefined && filters.min !== null ?
      String(filters.min)
    : "",
  );
  const [max, setMax] = useState(
    filters.max !== undefined && filters.max !== null ?
      String(filters.max)
    : "",
  );

  const [sliderValues, setSliderValues] = useState<[number, number]>([
    filters.min ?? PRICE_MIN,
    filters.max ?? PRICE_MAX,
  ]);

  const isSyncingFromFilters = useRef(false);

  useEffect(() => {
    isSyncingFromFilters.current = true;
    setMin(
      filters.min !== undefined && filters.min !== null ?
        String(filters.min)
      : "",
    );
    setMax(
      filters.max !== undefined && filters.max !== null ?
        String(filters.max)
      : "",
    );
    setSliderValues([filters.min ?? PRICE_MIN, filters.max ?? PRICE_MAX]);
    const t = setTimeout(() => {
      isSyncingFromFilters.current = false;
    }, 0);
    return () => clearTimeout(t);
  }, [filters.min, filters.max]);

  useEffect(() => {
    if (isSyncingFromFilters.current) return;
    const timeout = setTimeout(() => {
      const parsedMin = min === "" ? null : Number(min);
      const parsedMax = max === "" ? null : Number(max);
      if (min !== "" && Number.isNaN(parsedMin)) return;
      if (max !== "" && Number.isNaN(parsedMax)) return;
      const nextMin =
        parsedMin !== null && !Number.isNaN(parsedMin) ? parsedMin : null;
      const nextMax =
        parsedMax !== null && !Number.isNaN(parsedMax) ? parsedMax : null;
      const currentMin = filters.min ?? null;
      const currentMax = filters.max ?? null;
      if (nextMin !== currentMin || nextMax !== currentMax) {
        void setFilters({ min: nextMin, max: nextMax, page: null });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [min, max, filters.min, filters.max, setFilters]);

  const selectCategories = (next: string[]) => {
    void setFilters({ categories: next, page: null });
  };

  const handleSliderValueChange = (value: number | readonly number[]) => {
    const arr = value as readonly number[];
    setSliderValues([arr[0] ?? PRICE_MIN, arr[1] ?? PRICE_MAX]);
  };

  const handleSliderCommitted = (value: number | readonly number[]) => {
    const arr = value as readonly number[];
    const rawMin = arr[0] ?? PRICE_MIN;
    const rawMax = arr[1] ?? PRICE_MAX;
    const nextMin = rawMin <= PRICE_MIN ? null : rawMin;
    const nextMax = rawMax >= PRICE_MAX ? null : rawMax;
    isSyncingFromFilters.current = true;
    setMin(nextMin === null ? "" : String(nextMin));
    setMax(nextMax === null ? "" : String(nextMax));
    setSliderValues([rawMin, rawMax]);
    void setFilters({ min: nextMin, max: nextMax, page: null });
    setTimeout(() => {
      isSyncingFromFilters.current = false;
    }, 0);
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
          className="shrink-0 border-current bg-transparent px-1.5 py-0 text-[10px] tabular-nums data-[state=on]:bg-transparent">
          {category.count}
        </Badge>
      </ToggleGroupItem>
    );
  };

  return (
    <aside className="hidden w-full flex-col gap-6 lg:flex lg:w-64 lg:shrink-0">
      <Card className="flex flex-col gap-6 p-4">
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

              {/* Single ToggleGroup for all category pills, preserves cross-group multi-select */}
              <ToggleGroup
                multiple
                orientation="vertical"
                className="w-full flex-col items-stretch gap-4"
                value={activeCategories}
                onValueChange={(values) => {
                  const next = values.filter((value) => value !== ALL_CATEGORY);
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
                        {groupCats.map((category) => renderPill(category))}
                      </div>
                    </div>
                  );
                })}
                {ungrouped.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {ungrouped.map((category) => renderPill(category))}
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
                onValueChange={handleSliderValueChange}
                onValueCommitted={handleSliderCommitted}
              />
              <div className="text-muted-foreground mt-2 flex justify-between text-xs tabular-nums">
                <span>₹{sliderValues[0].toLocaleString()}</span>
                <span>₹{sliderValues[1].toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Field className="min-w-0 flex-1">
                <FieldLabel
                  htmlFor="min-price"
                  className="sr-only">
                  Minimum price
                </FieldLabel>
                <Input
                  id="min-price"
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={min}
                  onChange={(event) => setMin(event.target.value)}
                />
              </Field>
              <Field className="min-w-0 flex-1">
                <FieldLabel
                  htmlFor="max-price"
                  className="sr-only">
                  Maximum price
                </FieldLabel>
                <Input
                  id="max-price"
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={max}
                  onChange={(event) => setMax(event.target.value)}
                />
              </Field>
            </div>
          </Field>
        </FieldGroup>
      </Card>
    </aside>
  );
};

export default FilterSidebar;
