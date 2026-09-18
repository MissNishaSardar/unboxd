"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/shadcnui/button";
import { Input } from "@/components/shadcnui/input";

const AdminOrderDateFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") ?? "";
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const replaceDate = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("date", next);
    } else {
      params.delete("date");
    }
    params.delete("page");
    const query = params.toString();
    router.replace(`/admin/orders${query ? `?${query}` : ""}` as Route);
  };

  return (
    <>
      <Button
        variant={date === "" ? "default" : "outline"}
        size="sm"
        onClick={() => replaceDate("")}>
        All
      </Button>
      <Button
        variant={date === today && date !== "" ? "default" : "outline"}
        size="sm"
        onClick={() => replaceDate(today)}>
        Today
      </Button>
      <Input
        type="date"
        value={date}
        onChange={(event) => replaceDate(event.target.value)}
        aria-label="Order date"
        className="h-8 w-fit"
      />
    </>
  );
};

export default AdminOrderDateFilter;
