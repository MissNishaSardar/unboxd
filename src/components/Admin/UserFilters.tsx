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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";

const SORT_OPTIONS = [
  { value: "joined_desc", label: "Newest first" },
  { value: "joined_asc", label: "Oldest first" },
  { value: "name_asc", label: "Name A to Z" },
  { value: "name_desc", label: "Name Z to A" },
  { value: "email_asc", label: "Email A to Z" },
  { value: "email_desc", label: "Email Z to A" },
];

const UserFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const push = useCallback(
    (params: URLSearchParams) => {
      params.delete("page");
      router.replace(`/admin/users?${params.toString()}` as Route);
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

  const role = searchParams.get("role") ?? "all";
  const sort = searchParams.get("sort") ?? "joined_desc";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search users..."
        />
      </InputGroup>
      <Select
        value={role}
        onValueChange={(value) =>
          update("role", value === "all" || value === null ? "" : value)
        }>
        <SelectTrigger aria-label="Filter by role">
          <SelectValue placeholder="All roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={sort}
        onValueChange={(value) =>
          update("sort", value === "joined_desc" || value === null ? "" : value)
        }>
        <SelectTrigger aria-label="Sort users">
          <SelectValue placeholder="Sort" />
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
    </div>
  );
};

export default UserFilters;
