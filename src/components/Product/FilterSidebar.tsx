"use client";

import { useState } from "react";
import {
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/shadcnui/toggle-group";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export type FilterCategory = {
  slug: string;
  name: string;
  count: number;
};

const ALL_CATEGORY = "all";

const FilterSidebar = ({ categories }: { categories: FilterCategory[] }) => {
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

  const activeCategory = filters.category;
  const sort = filters.sort ?? "newest";
  const [min, setMin] = useState(filters.min ? String(filters.min) : "");
  const [max, setMax] = useState(filters.max ? String(filters.max) : "");

  const selectCategory = (slug: string | null) => {
    void setFilters({ category: slug, page: null });
  };

  const applyPrice = () => {
    void setFilters({
      min: min === "" ? null : Number(min),
      max: max === "" ? null : Number(max),
      page: null,
    });
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
          <FieldTitle>Sort</FieldTitle>
          <Select
            value={sort}
            onValueChange={(value) =>
              void setFilters({ sort: value ?? null, page: null })
            }
            items={SORT_OPTIONS}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {SORT_OPTIONS.find((option) => option.value === sort)?.label}
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
        </Field>

        <Field>
          <FieldTitle>Price range</FieldTitle>
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
          <Button
            size="sm"
            variant="outline"
            onClick={applyPrice}>
            Apply
          </Button>
        </Field>
      </FieldGroup>
    </aside>
  );
};

export default FilterSidebar;
