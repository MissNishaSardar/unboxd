import CategoryForm from "@/components/Admin/CategoryForm";
import { requireAdminPage } from "@/lib/guard";
import { getAdminCategoryOptions } from "@/server/admin/queries";

const AdminCategoryNewPage = async () => {
  await requireAdminPage();

  const categories = await getAdminCategoryOptions();

  return (
    <div className="mx-auto max-w-2xl">
      <CategoryForm
        mode="create"
        categories={categories}
      />
    </div>
  );
};

export default AdminCategoryNewPage;
