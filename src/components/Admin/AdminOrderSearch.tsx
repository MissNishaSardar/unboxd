"use client";

/* eslint-disable react-hooks/set-state-in-effect -- syncing the input with the URL after Clear filters or back/forward navigation is intentional */

import { SearchIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/shadcnui/input-group";

const AdminOrderSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const [value, setValue] = useState(urlSearch);

  // Keep the input in sync when the URL changes elsewhere, such as the
  // Clear filters button or browser back and forward navigation.
  useEffect(() => {
    setValue(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    // Skip navigation while the input already matches the URL. Without
    // this guard every filter change retriggers the timer and pushes a
    // duplicate navigation.
    if (value.trim() === urlSearch) return;
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("search", value.trim());
      } else {
        params.delete("search");
      }
      params.delete("page");
      const next = params.toString();
      if (next === searchParams.toString()) return;
      router.replace(`/admin/orders${next ? `?${next}` : ""}` as Route);
    }, 300);
    return () => clearTimeout(timeout);
  }, [value, urlSearch, searchParams, router]);

  return (
    <InputGroup>
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search orders..."
        aria-label="Search orders"
      />
    </InputGroup>
  );
};

export default AdminOrderSearch;
