"use client";

import { useCallback, useMemo, useState, type HTMLAttributes } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type {
  ColumnDef,
  OnChangeFn,
  Row,
  SortingState,
} from "@tanstack/react-table";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  GripVertical,
  PencilIcon,
} from "lucide-react";
import CategoryActions from "@/components/Admin/CategoryActions";
import DataTable from "@/components/Admin/DataTable";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { toast } from "@/components/shadcnui/toast";
import { moveCategoryTo } from "@/server/admin/categories";
import type { AdminCategoryNode } from "@/server/admin/queries";

export type AdminCategoryFlatRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  position: number;
  productCount: number;
  totalProductCount: number;
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

const binaryCompare = (x: string, y: string) =>
  x < y ? -1
  : x > y ? 1
  : 0;

// Mirrors the server contract: position asc, name asc in SQLite binary
// collation, then id. Keep this equal to the server orderBy so the drag
// preview matches the landed order when position ties.
const byPosition = (a: AdminCategoryNode, b: AdminCategoryNode) =>
  a.position - b.position ||
  binaryCompare(a.name, b.name) ||
  binaryCompare(a.id, b.id);

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
      return (
        (a.totalProductCount - b.totalProductCount) * dir ||
        (a.productCount - b.productCount) * dir
      );
    }
    if (sort.id === "position") {
      return byPosition(a, b) * dir;
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
      parentId: node.parentId,
      position: node.position,
      productCount: node.productCount,
      totalProductCount: node.totalProductCount,
      childCount: node.children.length,
      depth,
      categories,
    });
    flattenTree(node.children, depth + 1, categories, out);
  }
  return out;
};

type DropZone = "above" | "inside" | "below";

const categoryCollision: CollisionDetection = ({
  active,
  pointerCoordinates,
}) => {
  if (!pointerCoordinates || typeof document === "undefined") return [];
  const hit = document
    .elementsFromPoint(pointerCoordinates.x, pointerCoordinates.y)
    .find((el) => el instanceof HTMLElement && el.closest("[data-cat-row]"));
  const rowEl =
    hit instanceof HTMLElement ? hit.closest("[data-cat-row]") : null;
  if (!(rowEl instanceof HTMLElement)) return [];
  const rowId = rowEl.getAttribute("data-cat-row");
  if (!rowId || rowId === String(active.id)) return [];
  const rect = rowEl.getBoundingClientRect();
  const ratio = (pointerCoordinates.y - rect.top) / Math.max(1, rect.height);
  const zone: DropZone =
    ratio < 0.33 ? "above"
    : ratio > 0.67 ? "below"
    : "inside";
  // The id must match a registered droppable for dnd-kit to engage its over
  // state, so the zone travels in data instead of a synthetic composite id.
  return [{ id: rowId, data: { zone } }];
};

const computeMove = (
  rows: AdminCategoryFlatRow[],
  activeId: string,
  overRowId: string,
  zone: DropZone,
): { parentId: string | null; index: number } | { error: "own" } => {
  const activeIdx = rows.findIndex((row) => row.id === activeId);
  if (activeIdx < 0) return { error: "own" };
  const own = new Set<string>([activeId]);
  const depth = rows[activeIdx].depth;
  for (
    let i = activeIdx + 1;
    i < rows.length && rows[i].depth > depth;
    i += 1
  ) {
    own.add(rows[i].id);
  }
  if (own.has(overRowId)) return { error: "own" };
  const rest = rows.filter((row) => !own.has(row.id));
  const overIdx = rest.findIndex((row) => row.id === overRowId);
  if (overIdx < 0) return { error: "own" };
  if (zone === "inside") {
    return {
      parentId: overRowId,
      index: rest.filter((row) => row.parentId === overRowId).length,
    };
  }
  const parentId = rest[overIdx].parentId;
  const overSiblingIdx = rest
    .filter((row) => row.parentId === parentId)
    .findIndex((row) => row.id === overRowId);
  return {
    parentId,
    index: zone === "above" ? overSiblingIdx : overSiblingIdx + 1,
  };
};

const OrderDragHandle = ({
  id,
  name,
  disabled,
}: {
  id: string;
  name: string;
  disabled: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef: setDragNodeRef,
    isDragging,
  } = useDraggable({
    id,
    disabled,
  });
  // Registering the row as a droppable is what lets dnd-kit engage its over
  // state: collision ids must resolve to a registered droppable with a rect.
  const { setNodeRef: setDroppableNodeRef } = useDroppable({ id });
  return (
    <span
      ref={(node) => {
        setDragNodeRef(node);
        setDroppableNodeRef(node);
      }}
      {...attributes}
      {...listeners}
      className="inline-flex">
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        aria-label={`Drag to reorder ${name}`}
        title={disabled ? "Sort by Order to reorder" : "Drag to reorder"}>
        <GripVertical
          aria-hidden="true"
          className={isDragging ? "opacity-40" : undefined}
        />
      </Button>
    </span>
  );
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
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    rowId: string;
    zone: DropZone;
  } | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "position", desc: false },
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

  const canDrag =
    sorting[0]?.id === "position" && sorting[0]?.desc === false && !isPending;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!canDrag) return;
    setActiveId(String(event.active.id));
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const collision = event.collisions?.[0];
    const zone = collision?.data?.zone as DropZone | undefined;
    if (!collision || !zone || String(collision.id) === activeId) {
      setDropTarget((previous) => (previous === null ? previous : null));
      return;
    }
    const rowId = String(collision.id);
    setDropTarget((previous) =>
      previous && previous.rowId === rowId && previous.zone === zone ?
        previous
      : { rowId, zone },
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const overId = event.over ? String(event.over.id) : null;
    const zone = event.collisions?.[0]?.data?.zone as DropZone | undefined;
    const moving = activeId;
    setActiveId(null);
    setDropTarget(null);
    if (!overId || !zone || !moving || !canDrag) return;
    if (overId === moving) return;
    const move = computeMove(rows, moving, overId, zone);
    if ("error" in move) {
      toast.add({
        title: "Cannot move inside its own subcategory",
        type: "error",
      });
      return;
    }
    setIsPending(true);
    const result = await moveCategoryTo(moving, {
      parentId: move.parentId,
      index: move.index,
    });
    setIsPending(false);
    if (result.ok) {
      if (result.moved) router.refresh();
    } else if (result.error === "INVALID_INPUT") {
      toast.add({ title: "That move is not allowed", type: "error" });
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDropTarget(null);
  };

  const getRowProps = useCallback(
    (row: Row<AdminCategoryFlatRow>) => {
      const props = {
        "data-cat-row": row.original.id,
      } as HTMLAttributes<HTMLTableRowElement>;
      if (dropTarget && dropTarget.rowId === row.original.id) {
        props.className =
          dropTarget.zone === "inside" ? "bg-accent"
          : dropTarget.zone === "above" ?
            "shadow-[inset_0_2px_0_0_var(--color-primary)]"
          : "shadow-[inset_0_-2px_0_0_var(--color-primary)]";
      }
      return props;
    },
    [dropTarget],
  );

  const activeRow =
    activeId ? (rows.find((row) => row.id === activeId) ?? null) : null;

  const columns = useMemo<ColumnDef<AdminCategoryFlatRow>[]>(
    () => [
      {
        id: "position",
        accessorKey: "position",
        header: ({ column }) => (
          <SortHeaderButton
            label="Order"
            sorted={column.getIsSorted()}
            onToggle={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          />
        ),
        cell: ({ row }) => (
          <OrderDragHandle
            id={row.original.id}
            name={row.original.name}
            disabled={!canDrag}
          />
        ),
      },
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
        cell: ({ row }) => {
          const direct = row.original.productCount;
          const total = row.original.totalProductCount;
          if (row.original.childCount === 0) {
            return <span className="tabular-nums">{direct}</span>;
          }
          const label = `${direct} direct · ${total} total`;
          return (
            <span
              className="whitespace-nowrap tabular-nums"
              title={label}
              aria-label={`${row.original.name}: ${label}`}>
              {label}
            </span>
          );
        },
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
    [canDrag],
  );

  const toolbar = (
    <div className="flex items-center justify-between gap-2">
      <p className="text-muted-foreground text-xs tabular-nums">
        {total} categor{total === 1 ? "y" : "ies"}
      </p>
    </div>
  );

  return (
    <DndContext
      // Stable id keeps the drag handle describedby value identical on the
      // server and the client. The library default uses a module counter
      // that never matches across server and client renders.
      id="admin-categories"
      sensors={sensors}
      collisionDetection={categoryCollision}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}>
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
        minWidthClass="min-w-[840px]"
        getRowProps={getRowProps}
      />
      <DragOverlay dropAnimation={null}>
        {activeRow ?
          <div className="border-border bg-card rounded-xl border px-4 py-2 text-sm font-medium shadow-sm">
            {activeRow.name}
          </div>
        : null}
      </DragOverlay>
    </DndContext>
  );
};

export default CategoriesTable;
