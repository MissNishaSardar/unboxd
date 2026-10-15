"use client";

/* eslint-disable react-hooks/set-state-in-effect -- clearing row selection after filter or sort change is intentional */
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { RowSelectionState } from "@tanstack/react-table";
import { Trash2Icon, RotateCcwIcon } from "lucide-react";
import DataTable from "@/components/Admin/DataTable";
import ProductsFilters from "@/components/Admin/ProductsFilters";
import {
  getProductsColumns,
  type AdminProductRow,
} from "@/components/Admin/ProductsColumns";
import { Button } from "@/components/shadcnui/button";
import { toast } from "@/components/shadcnui/toast";
import {
  bulkDeleteProducts,
  bulkRestoreProducts,
} from "@/server/admin/catalog";

const urlSortToSortingState = (urlSort: string): SortingState => {
  if (urlSort === "oldest") return [{ id: "createdAt", desc: false }];
  if (urlSort === "price_asc") return [{ id: "price", desc: false }];
  if (urlSort === "price_desc") return [{ id: "price", desc: true }];
  if (urlSort === "name_asc") return [{ id: "name", desc: false }];
  if (urlSort === "name_desc") return [{ id: "name", desc: true }];
  return [{ id: "createdAt", desc: true }];
};

const ProductsTable = ({
  products,
  total,
  lowStockThreshold = 5,
}: {
  products: AdminProductRow[];
  total: number;
  lowStockThreshold?: number;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetKey = searchParams.toString();

  const [isPending, setIsPending] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    setRowSelection({});
  }, [resetKey]);

  const urlSort = searchParams.get("sort") ?? "newest";
  const sorting = useMemo(() => urlSortToSortingState(urlSort), [urlSort]);

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    if (next.length === 0) return;
    const { id, desc } = next[0];
    const nextUrlSort =
      id === "name" ?
        desc ? "name_desc"
        : "name_asc"
      : id === "price" ?
        desc ? "price_desc"
        : "price_asc"
      : desc ? "newest"
      : "oldest";
    const params = new URLSearchParams(searchParams.toString());
    if (nextUrlSort === "newest") params.delete("sort");
    else params.set("sort", nextUrlSort);
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `/admin/products?${query}` : "/admin/products");
  };

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id] === true),
    [rowSelection],
  );

  const columns = useMemo(() => getProductsColumns(), []);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsPending(true);
    const result = await bulkDeleteProducts({ productIds: selectedIds });
    setIsPending(false);
    if (result.ok) {
      toast.add({
        title: `${result.updated} product${result.updated === 1 ? "" : "s"} hidden`,
        type: "success",
      });
      if (result.skipped > 0) {
        toast.add({
          title: `${result.skipped} skipped`,
          type: "info",
        });
      }
      setRowSelection({});
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    setIsPending(true);
    const result = await bulkRestoreProducts({ productIds: selectedIds });
    setIsPending(false);
    if (result.ok) {
      toast.add({
        title: `${result.updated} product${result.updated === 1 ? "" : "s"} restored`,
        type: "success",
      });
      if (result.skipped > 0) {
        toast.add({
          title: `${result.skipped} skipped`,
          type: "info",
        });
      }
      setRowSelection({});
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const toolbar = (
    <div className="flex flex-col gap-3">
      <ProductsFilters lowStockThreshold={lowStockThreshold} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs tabular-nums">
          {total} product{total === 1 ? "" : "s"}
          {selectedIds.length > 0 ? ` · ${selectedIds.length} selected` : ""}
        </p>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRestore}
              disabled={isPending}>
              <RotateCcwIcon
                data-icon="inline-start"
                aria-hidden="true"
              />
              Restore
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isPending}>
              <Trash2Icon
                data-icon="inline-start"
                aria-hidden="true"
              />
              Hide
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={products}
      getRowId={(row) => row.id}
      sorting={sorting}
      onSortingChange={handleSortingChange}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      toolbar={toolbar}
      emptyTitle="No products found"
      emptyDescription="Try adjusting your search or filters."
      minWidthClass="min-w-[880px]"
    />
  );
};

export default ProductsTable;
