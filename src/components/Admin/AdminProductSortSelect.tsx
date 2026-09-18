"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
] as const;

const AdminProductSortSelect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSort = searchParams.get("sort");
  const sort =
    SORT_OPTIONS.some((option) => option.value === rawSort) ?
      rawSort!
    : "newest";

  const handleChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") params.delete("sort");
    else params.set("sort", value);
    params.delete("page");
    const query = params.toString();
    router.replace(`/admin/products${query ? `?${query}` : ""}` as Route);
  };

  return (
    <Select
      value={sort}
      onValueChange={handleChange}>
      <SelectTrigger
        size="sm"
        aria-labelledby="admin-products-sort-label">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AdminProductSortSelect;
