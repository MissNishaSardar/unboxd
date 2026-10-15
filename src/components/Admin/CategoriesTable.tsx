"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  ColumnDef,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  PencilIcon,
} from "lucide-react";
import CategoryActions from "@/components/Admin/CategoryActions";
import DataTable from "@/components/Admin/DataTable";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import type { AdminCategoryNode } from "@/server/admin/queries";

export type AdminCategoryFlatRow = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  childCount: number;
  depth: number;
  categories: { id: string; name: string; parentId: string | null }[];
};

const SortHeaderButton = ({
  label,
  sorted,
  onToggle,
}: {
  label: string;
  sorted: false | "asc" | "desc";
  onToggle: () => void;
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onToggle}
    aria-label={`Sort by ${label}`}>
    {label}
    {sorted === "asc" ?
      <ArrowUpIcon
        data-icon="inline-end"
        aria-hidden="true"
      />
    : sorted === "desc" ?
      <ArrowDownIcon
        data-icon="inline-end"
        aria-hidden="true"
      />
    : <ArrowUpDownIcon
        data-icon="inline-end"
        aria-hidden="true"
      />
    }
  </Button>
);

const sortTree = (
  nodes: AdminCategoryNode[],
  sorting: SortingState,
): AdminCategoryNode[] => {
  const copy = [...nodes];
  const sort = sorting[0];
  if (!sort) return copy;
  const dir = sort.desc ? -1 : 1;
  copy.sort((a, b) => {
    if (sort.id === "products") {
      return (a.productCount - b.productCount) * dir;
    }
    return a.name.localeCompare(b.name) * dir;
  });
  return copy.map((node) => ({
    ...node,
    children: sortTree(node.children, sorting),
  }));
};

const flattenTree = (
  nodes: AdminCategoryNode[],
  depth: number,
  categories: { id: string; name: string; parentId: string | null }[],
  out: AdminCategoryFlatRow[] = [],
): AdminCategoryFlatRow[] => {
  for (const node of nodes) {
    out.push({
      id: node.id,
      name: node.name,
      slug: node.slug,
      productCount: node.productCount,
      childCount: node.children.length,
      depth,
      categories,
    });
    flattenTree(node.children, depth + 1, categories, out);
  }
  return out;
};

const CategoriesTable = ({
  tree,
  categories,
  total,
}: {
  tree: AdminCategoryNode[];
  categories: { id: string; name: string; parentId: string | null }[];
  total: number;
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    if (next.length === 0) return;
    setSorting(next);
  };

  const rows = useMemo(() => {
    const sorted = sortTree(tree, sorting);
    return flattenTree(sorted, 0, categories);
  }, [tree, categories, sorting]);

  const columns = useMemo<ColumnDef<AdminCategoryFlatRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <SortHeaderButton
            label="Name"
            sorted={column.getIsSorted()}
            onToggle={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          />
        ),
        cell: ({ row }) => (
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${row.original.depth * 1.5}rem` }}>
            {row.original.depth > 0 && (
              <span className="text-muted-foreground text-xs">└</span>
            )}
            <Link
              href={`/categories/${row.original.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View storefront page"
              className="font-medium hover:underline">
              {row.original.name}
            </Link>
          </div>
        ),
      },
      {
        id: "slug",
        header: "Slug",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.slug}</span>
        ),
      },
      {
        id: "products",
        accessorKey: "productCount",
        header: ({ column }) => (
          <SortHeaderButton
            label="Products"
            sorted={column.getIsSorted()}
            onToggle={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.productCount}</span>
        ),
      },
      {
        id: "structure",
        header: "Structure",
        cell: ({ row }) =>
          row.original.childCount > 0 ?
            <Badge variant="secondary">
              {row.original.childCount} subcategor
              {row.original.childCount === 1 ? "y" : "ies"}
            </Badge>
          : <span className="text-muted-foreground text-sm">Leaf</span>,
      },
      {
        id: "actions",
        header: () => <span className="flex justify-end">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              render={
                <Link href={`/admin/categories/${row.original.id}/edit`} />
              }
              nativeButton={false}
              variant="ghost"
              size="sm">
              <PencilIcon
                data-icon="inline-start"
                aria-hidden="true"
              />
              Edit
            </Button>
            <CategoryActions
              categoryId={row.original.id}
              categoryName={row.original.name}
              productCount={row.original.productCount}
              childCount={row.original.childCount}
              categories={row.original.categories}
            />
          </div>
        ),
      },
    ],
    [],
  );

  const toolbar = (
    <div className="flex items-center justify-between gap-2">
      <p className="text-muted-foreground text-xs tabular-nums">
        {total} categor{total === 1 ? "y" : "ies"}
      </p>
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      sorting={sorting}
      onSortingChange={handleSortingChange}
      rowSelection={{} as RowSelectionState}
      onRowSelectionChange={() => {}}
      enableRowSelection={false}
      toolbar={toolbar}
      emptyTitle="No categories yet"
      emptyDescription="Create your first category to organize products."
      minWidthClass="min-w-[720px]"
    />
  );
};

export default CategoriesTable;
