import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryForm from "@/components/Admin/CategoryForm";
import { requireAdminPage } from "@/lib/guard";

export const metadata: Metadata = {
  title: "Edit Category",
  description: "Edit category details on Unboxd.",
};
import {
  getAdminCategoryForEdit,
  getAdminCategoryOptions,
} from "@/server/admin/queries";

const AdminCategoryEditPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  await requireAdminPage();

  const { id } = await params;
  const [category, categories] = await Promise.all([
    getAdminCategoryForEdit(id),
    getAdminCategoryOptions(),
  ]);
  if (!category) notFound();

  const excludeIds = new Set<string>([id]);
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const item of categories) {
      if (item.parentId === current && !excludeIds.has(item.id)) {
        excludeIds.add(item.id);
        queue.push(item.id);
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <CategoryForm
        mode="edit"
        categoryId={id}
        initialData={{
          name: category.name,
          parentId: category.parentId,
          position: category.position,
        }}
        categories={categories}
        excludeIds={[...excludeIds]}
      />
    </div>
  );
};

export default AdminCategoryEditPage;
