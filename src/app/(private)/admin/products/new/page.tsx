import type { Metadata } from "next";
import ProductForm from "@/components/Admin/ProductForm";
import { requireAdminPage } from "@/lib/guard";
import { getAdminCategories } from "@/server/admin/queries";

export const metadata: Metadata = {
  title: "New Product",
  description: "Add a new product to the Unboxd catalog.",
};

const NewProductPage = async () => {
  await requireAdminPage();
  const categories = await getAdminCategories();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          New product
        </h1>
        <p className="text-muted-foreground text-sm">
          Add a product to the catalog
        </p>
      </div>
      <ProductForm
        mode="create"
        categories={categories}
      />
    </div>
  );
};

export default NewProductPage;
