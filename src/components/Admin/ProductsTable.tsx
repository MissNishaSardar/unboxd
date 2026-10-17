"use client";

/* eslint-disable react-hooks/set-state-in-effect -- clearing row selection after filter or sort change is intentional */
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { RowSelectionState } from "@tanstack/react-table";
import { EyeOffIcon, RotateCcwIcon, XIcon } from "lucide-react";
import DataTable from "@/components/Admin/DataTable";
import ProductsFilters from "@/components/Admin/ProductsFilters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcnui/alert-dialog";
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

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    setIsPending(true);
    const result = await bulkDeleteProducts({ productIds: selectedIds });
    setIsPending(false);
    if (result.ok) {
      toast.add({
        title: `${result.updated} product${result.updated === 1 ? "" : "s"} deactivated`,
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

  const hasSelection = selectedIds.length > 0;
  const selectedProducts = useMemo(
    () => products.filter((product) => selectedIds.includes(product.id)),
    [products, selectedIds],
  );
  const activeSelected = selectedProducts.filter(
    (product) => product.isActive,
  ).length;
  const inactiveSelected = selectedProducts.length - activeSelected;
  const showDeactivate = activeSelected > 0;
  const showRestore = inactiveSelected > 0;
  const loadedCount = products.length;
  const deactivateNoun = `Deactivate ${activeSelected} product${activeSelected === 1 ? "" : "s"}`;
  const appliesToShownOnly = loadedCount < total;

  const filterToolbar = (
    <div className="flex flex-col gap-3">
      <ProductsFilters lowStockThreshold={lowStockThreshold} />
      <p className="text-muted-foreground text-xs tabular-nums">
        {total} match{total === 1 ? "" : "es"}
      </p>
    </div>
  );

  const bulkBar = (
    <div className="border-border bg-card sticky top-2 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2 shadow-sm">
      <p className="text-xs tabular-nums">
        {hasSelection ?
          `${selectedIds.length} of ${loadedCount} shown selected${appliesToShownOnly ? " · applies to shown rows only" : ""}`
        : "No products selected"}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkRestore}
          disabled={!showRestore || isPending}
          title={
            showRestore ? undefined : "Select inactive products to restore"
          }>
          <RotateCcwIcon
            data-icon="inline-start"
            aria-hidden="true"
          />
          Restore {inactiveSelected}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                disabled={!showDeactivate || isPending}
                title={
                  showDeactivate ? undefined : (
                    "Select active products to deactivate"
                  )
                }>
                <EyeOffIcon
                  data-icon="inline-start"
                  aria-hidden="true"
                />
                Deactivate {activeSelected}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogTitle>{deactivateNoun}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be inactive and hidden from the storefront. You can
              restore them later.
              {inactiveSelected > 0 ?
                ` ${inactiveSelected} already inactive will be skipped.`
              : ""}
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDeactivate}
                disabled={isPending}>
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRowSelection({})}
          disabled={!hasSelection || isPending}
          aria-label="Clear product selection">
          <XIcon
            data-icon="inline-start"
            aria-hidden="true"
          />
          Clear
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {bulkBar}
      <DataTable
        columns={columns}
        data={products}
        getRowId={(row) => row.id}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        toolbar={filterToolbar}
        emptyTitle="No products found"
        emptyDescription="Try adjusting your search or filters."
        minWidthClass="min-w-[880px]"
      />
    </div>
  );
};

export default ProductsTable;
