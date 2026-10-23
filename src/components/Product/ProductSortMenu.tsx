"use client";

import { useState } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { Button } from "@/components/shadcnui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcnui/popover";
import { SORT_OPTIONS } from "@/components/Product/sortOptions";

const ProductSortMenu = () => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useQueryStates(
    { sort: parseAsString, page: parseAsInteger },
    { shallow: false },
  );
  const sort = filters.sort ?? "newest";
  const current = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];
  const CurrentIcon = current.icon;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full shadow-none"
          />
        }>
        <CurrentIcon className="text-muted-foreground size-4" />
        {current.label}
        <ChevronDownIcon className="text-muted-foreground size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-56 max-w-[calc(100vw-24px)] rounded-xl p-1">
        {SORT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isRating = option.value.startsWith("rating_");
          const isOn = option.value === sort;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                void setFilters({ sort: option.value, page: null });
                setOpen(false);
              }}
              className="hover:bg-accent flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left">
              <Icon
                className={
                  isRating ?
                    "size-3.5 shrink-0 fill-amber-400 text-amber-400"
                  : "text-muted-foreground size-3.5 shrink-0"
                }
              />
              <span className="flex flex-col items-start leading-none">
                <span className="text-xs font-medium">{option.label}</span>
                <span className="text-muted-foreground mt-1 text-[11px] font-normal">
                  {option.description}
                </span>
              </span>
              {isOn && (
                <CheckIcon className="text-primary ml-auto size-3.5 shrink-0" />
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};

export default ProductSortMenu;
