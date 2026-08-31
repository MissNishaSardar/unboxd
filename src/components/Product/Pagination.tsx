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
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return {
      pathname,
      query: Object.fromEntries(params),
    } as const;
  };

  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
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
        render={<Link href={buildHref(currentPage - 1)} />}
        nativeButton={false}
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
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
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            className={cn(page === currentPage && "pointer-events-none")}
            aria-current={page === currentPage ? "page" : undefined}>
            {page}
          </Button>,
      )}
      <Button
        render={<Link href={buildHref(currentPage + 1)} />}
        nativeButton={false}
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        aria-label="Next page">
        Next
      </Button>
    </nav>
  );
};

export default Pagination;
