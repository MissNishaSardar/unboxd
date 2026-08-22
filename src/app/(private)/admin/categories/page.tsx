import Link from "next/link";
import { FolderTreeIcon, PencilIcon } from "lucide-react";
import CategoryActions from "@/components/Admin/CategoryActions";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent } from "@/components/shadcnui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/guard";
import {
  type AdminCategoryNode,
  getAdminCategoryOptions,
  getAdminCategoryTree,
} from "@/server/admin/queries";

export const metadata: Metadata = {
  title: "Categories",
  description: "Manage the Unboxd category tree.",
};

const CategoryRow = ({
  category,
  depth,
  categories,
}: {
  category: AdminCategoryNode;
  depth: number;
  categories: { id: string; name: string; parentId: string | null }[];
}) => (
  <>
    <TableRow>
      <TableCell>
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: `${depth * 1.5}rem` }}>
          {depth > 0 && (
            <span className="text-muted-foreground text-xs">└</span>
          )}
          <span className="font-medium">{category.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{category.slug}</TableCell>
      <TableCell className="tabular-nums">{category.productCount}</TableCell>
      <TableCell>
        {category.children.length > 0 ?
          <Badge variant="secondary">
            {category.children.length} subcategor
            {category.children.length === 1 ? "y" : "ies"}
          </Badge>
        : <span className="text-muted-foreground text-sm">Leaf</span>}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            render={<Link href={`/admin/categories/${category.id}/edit`} />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${category.name}`}>
            <PencilIcon aria-hidden="true" />
          </Button>
          <CategoryActions
            categoryId={category.id}
            categoryName={category.name}
            productCount={category.productCount}
            childCount={category.children.length}
            categories={categories}
          />
        </div>
      </TableCell>
    </TableRow>
    {category.children.map((child) => (
      <CategoryRow
        key={child.id}
        category={child}
        depth={depth + 1}
        categories={categories}
      />
    ))}
  </>
);

const AdminCategoriesPage = async () => {
  await requireAdminPage();

  const tree = await getAdminCategoryTree();
  const categories = await getAdminCategoryOptions();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Categories
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage the catalog category tree
          </p>
        </div>
        <Button
          render={<Link href="/admin/categories/new" />}
          nativeButton={false}>
          New category
        </Button>
      </div>

      {tree.length === 0 ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderTreeIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No categories yet</EmptyTitle>
            <EmptyDescription>
              Create your first category to organize products.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      : <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Structure</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tree.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    depth={0}
                    categories={categories}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      }
    </div>
  );
};

export default AdminCategoriesPage;
