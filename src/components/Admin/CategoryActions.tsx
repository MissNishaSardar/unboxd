"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import {
  deleteCategory,
  deleteCategoryCascade,
  getCategorySubtreeForDelete,
  reassignAndDeleteCategory,
  type CategorySubtreeNode,
} from "@/server/admin/categories";
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
import { Button } from "@/components/shadcnui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { toast } from "@/components/shadcnui/toast";

type CategoryOption = { id: string; name: string; parentId: string | null };

const CategoryActions = ({
  categoryId,
  categoryName,
  productCount,
  childCount,
  categories,
}: {
  categoryId: string;
  categoryName: string;
  productCount: number;
  childCount: number;
  categories: CategoryOption[];
}) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [subtree, setSubtree] = useState<CategorySubtreeNode | null>(null);
  const [subtreeLoading, setSubtreeLoading] = useState(false);

  const hasProducts = productCount > 0;
  const hasChildren = childCount > 0;

  const handleDelete = async () => {
    setIsPending(true);
    const result = await deleteCategory(categoryId);
    setIsPending(false);
    if (result.ok) {
      toast.add({ title: "Category deleted", type: "success" });
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const handleReassign = async () => {
    if (!targetCategoryId) return;
    setIsPending(true);
    const result = await reassignAndDeleteCategory(categoryId, {
      targetCategoryId,
    });
    setIsPending(false);
    if (result.ok) {
      toast.add({
        title: "Products reassigned, category deleted",
        type: "success",
      });
      router.refresh();
    } else if (result.error === "INVALID_INPUT") {
      toast.add({ title: "Invalid target category", type: "error" });
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const handleCascade = async () => {
    setIsPending(true);
    const result = await deleteCategoryCascade(categoryId);
    setIsPending(false);
    if (result.ok) {
      toast.add({
        title: `Deleted ${result.deletedCategories} categor${
          result.deletedCategories === 1 ? "y" : "ies"
        }`,
        description:
          result.hiddenProducts > 0 ?
            `${result.hiddenProducts} product${
              result.hiddenProducts === 1 ? "" : "s"
            } hidden`
          : undefined,
        type: "success",
      });
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const loadSubtree = async () => {
    setSubtreeLoading(true);
    const result = await getCategorySubtreeForDelete(categoryId);
    setSubtreeLoading(false);
    if (result.ok) {
      setSubtree(result.subtree);
    } else {
      toast.add({ title: "Could not load category tree", type: "error" });
    }
  };

  const renderTree = (node: CategorySubtreeNode, depth: number) => (
    <div
      key={node.id}
      className="flex flex-col gap-1">
      <div
        className="flex items-center justify-between gap-2"
        style={{ paddingLeft: `${depth * 1.25}rem` }}>
        <span className="text-sm">{node.name}</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {node.productCount} product{node.productCount === 1 ? "" : "s"}
        </span>
      </div>
      {node.children.map((child) => renderTree(child, depth + 1))}
    </div>
  );

  const trigger = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Delete ${categoryName}`}>
      <Trash2Icon aria-hidden="true" />
    </Button>
  );

  if (hasChildren) {
    return (
      <AlertDialog
        onOpenChange={(open) => {
          if (open) loadSubtree();
        }}>
        <AlertDialogTrigger render={trigger} />
        <AlertDialogContent>
          <AlertDialogTitle>
            Delete {categoryName} and its subcategories?
          </AlertDialogTitle>
          <AlertDialogDescription>
            The whole subtree will be hidden from the storefront. Products are
            not deleted, just hidden.
          </AlertDialogDescription>
          {subtreeLoading ?
            <p className="text-muted-foreground text-sm">Loading…</p>
          : subtree ?
            <div className="max-h-64 overflow-y-auto rounded-md border p-3">
              {renderTree(subtree, 0)}
            </div>
          : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep categories</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleCascade}
              disabled={isPending}>
              Delete subtree
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (hasProducts) {
    const reassignTargets = categories.filter(
      (category) => category.id !== categoryId,
    );
    return (
      <AlertDialog
        onOpenChange={(open) => {
          if (open) setTargetCategoryId("");
        }}>
        <AlertDialogTrigger render={trigger} />
        <AlertDialogContent>
          <AlertDialogTitle>
            Reassign {productCount} product{productCount === 1 ? "" : "s"} from{" "}
            {categoryName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Move all products to another category, then delete this one.
          </AlertDialogDescription>
          <Select
            value={targetCategoryId}
            onValueChange={(value) => setTargetCategoryId(value ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {reassignTargets.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep category</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleReassign}
              disabled={isPending || !targetCategoryId}>
              Reassign and delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogTitle>Delete {categoryName}?</AlertDialogTitle>
        <AlertDialogDescription>
          This category has no subcategories or products.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep category</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}>
            Delete category
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CategoryActions;
