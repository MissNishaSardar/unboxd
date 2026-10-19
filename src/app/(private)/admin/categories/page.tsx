import Link from "next/link";
import { FolderTreeIcon } from "lucide-react";
import CategoriesTable from "@/components/Admin/CategoriesTable";
import { Button } from "@/components/shadcnui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/guard";
import { connection } from "next/server";
import {
  getAdminCategoryOptions,
  getAdminCategoryTree,
} from "@/server/admin/queries";

export const metadata: Metadata = {
  title: "Categories",
  description: "Manage the Unboxd category tree.",
};

const AdminCategoriesPage = async () => {
  await requireAdminPage();
  // The tree must be read per request. Without this, the SQLite reads complete
  // during prerender and the category rows get baked into the static shell,
  // where revalidatePath cannot reach them and drag reorder stays invisible
  // until the server restarts.
  await connection();

  const tree = await getAdminCategoryTree();
  const categories = await getAdminCategoryOptions();
  const total = categories.length;

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
      : <CategoriesTable
          tree={tree}
          categories={categories}
          total={total}
        />
      }
    </div>
  );
};

export default AdminCategoriesPage;
