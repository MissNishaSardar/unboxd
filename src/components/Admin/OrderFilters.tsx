"use client";

import { SearchIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/shadcnui/input-group";
import { Input } from "@/components/shadcnui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { orderStatusConfig } from "@/lib/orders/status";

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

const OrderFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const push = useCallback(
    (params: URLSearchParams) => {
      params.delete("page");
      router.replace(`/admin/orders?${params.toString()}` as Route);
    },
    [router],
  );

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      push(params);
    },
    [searchParams, push],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) params.set("search", search);
      else params.delete("search");
      push(params);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, searchParams, push]);

  const status = searchParams.get("status") ?? "";
  const date = searchParams.get("date") ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customer..."
        />
      </InputGroup>
      <Select
        value={status}
        onValueChange={(value) =>
          update("status", value === "all" || value === null ? "" : value)
        }>
        <SelectTrigger>
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem
                key={option}
                value={option}>
                {orderStatusConfig[option].label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={date}
        onChange={(event) => update("date", event.target.value)}
        aria-label="Order date"
        className="w-fit"
      />
    </div>
  );
};

export default OrderFilters;
