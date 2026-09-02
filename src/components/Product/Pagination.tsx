"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";

const Pagination = ({
  currentPage,
  totalPages,
  pathname = "/products",
}: {
  currentPage: number;
  totalPages: number;
  pathname?: string;
}) => {
  const searchParams = useSearchParams();

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return {
      pathname,
      query: Object.fromEntries(params.entries()),
    } as const;
  };

  if (totalPages <= 1) return null;

  const effectivePage = Math.min(Math.max(1, currentPage), totalPages);
  const pages: (number | string)[] = [];
  const start = Math.max(1, effectivePage - 2);
  const end = Math.min(totalPages, effectivePage + 2);
  if (totalPages <= 7) {
    for (let page = 1; page <= totalPages; page++) pages.push(page);
  } else {
    for (let page = start; page <= end; page++) pages.push(page);
    // Add first page and ellipsis if needed
    if (start > 1) {
      if (start > 2) {
        pages.unshift("ellipsis-start");
      }
      pages.unshift(1);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push("ellipsis-end");
      }
      pages.push(totalPages);
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1.5">
      <Button
        render={<Link href={buildHref(effectivePage - 1)} />}
        nativeButton={false}
        variant="outline"
        size="sm"
        disabled={effectivePage <= 1}
        aria-label="Previous page">
        Prev
      </Button>
      {pages.map((page) =>
        typeof page === "string" ?
          <span
            key={page}
            className="text-muted-foreground px-1 text-sm"
            aria-hidden="true">
            ...
          </span>
        : <Button
            key={page}
            render={<Link href={buildHref(page)} />}
            nativeButton={false}
            variant={page === effectivePage ? "default" : "outline"}
            size="sm"
            className={cn(page === effectivePage && "pointer-events-none")}
            aria-current={page === effectivePage ? "page" : undefined}>
            {page}
          </Button>,
      )}
      <Button
        render={<Link href={buildHref(effectivePage + 1)} />}
        nativeButton={false}
        variant="outline"
        size="sm"
        disabled={effectivePage >= totalPages}
        aria-label="Next page">
        Next
      </Button>
    </nav>
  );
};

export default Pagination;
