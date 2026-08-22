import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductForm from "@/components/Admin/ProductForm";
import { requireAdminPage } from "@/lib/guard";

export const metadata: Metadata = {
  title: "Edit Product",
  description: "Edit product details on Unboxd.",
};
import {
  getAdminCategories,
  getAdminProductForEdit,
} from "@/server/admin/queries";

const EditProductPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  await requireAdminPage();
  const { id } = await params;

  const [product, categories] = await Promise.all([
    getAdminProductForEdit(id),
    getAdminCategories(),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Edit product
        </h1>
        <p className="text-muted-foreground text-sm">{product.name}</p>
      </div>
      <ProductForm
        mode="edit"
        productId={id}
        initialData={product}
        categories={categories}
      />
    </div>
  );
};

export default EditProductPage;
