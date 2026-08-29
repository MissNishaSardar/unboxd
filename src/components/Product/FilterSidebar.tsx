"use client";

/* eslint-disable react-hooks/set-state-in-effect -- syncing URL query state to local inputs/slider is intentional */

import { useEffect, useRef, useState } from "react";
import {
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { Badge } from "@/components/shadcnui/badge";
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

export type FilterCategory = {
  slug: string;
  name: string;
  count: number;
};

const ALL_CATEGORY = "all";

const PRICE_MIN = 0;
const PRICE_MAX = 250000;
const PRICE_STEP = 1000;

const FilterSidebar = ({ categories }: { categories: FilterCategory[] }) => {
  const [filters, setFilters] = useQueryStates(
    {
      category: parseAsString,
      min: parseAsFloat,
      max: parseAsFloat,
      page: parseAsInteger,
    },
    { shallow: false },
  );

  const activeCategory = filters.category;
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

  const selectCategory = (slug: string | null) => {
    void setFilters({ category: slug, page: null });
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

  return (
    <aside className="flex w-full flex-col gap-6 lg:w-56 lg:shrink-0">
      <FieldGroup className="gap-6">
        <Field>
          <FieldTitle>Category</FieldTitle>
          <ToggleGroup
            orientation="vertical"
            className="w-full"
            value={activeCategory ? [activeCategory] : [ALL_CATEGORY]}
            onValueChange={(values) =>
              selectCategory(
                values[0] === ALL_CATEGORY ? null : (values[0] ?? null),
              )
            }>
            <ToggleGroupItem
              value={ALL_CATEGORY}
              variant="outline"
              className="w-full justify-between">
              <span>All</span>
            </ToggleGroupItem>
            {categories.map((category) => (
              <ToggleGroupItem
                key={category.slug}
                value={category.slug}
                variant="outline"
                className="w-full justify-between">
                <span>{category.name}</span>
                <Badge
                  variant="outline"
                  className="shrink-0 tabular-nums">
                  {category.count}
                </Badge>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
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
    </aside>
  );
};

export default FilterSidebar;
