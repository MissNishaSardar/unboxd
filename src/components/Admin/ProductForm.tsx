"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import ProductDetailsFields from "@/components/Admin/ProductDetailsFields";
import ProductImagesFields from "@/components/Admin/ProductImagesFields";
import ProductVariantsFields from "@/components/Admin/ProductVariantsFields";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/shadcnui/alert-dialog";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcnui/tabs";
import { toast } from "@/components/shadcnui/toast";
import useNavigationGuard from "@/hooks/use-navigation-guard";
import {
  productFormSchema,
  type productFormInputType,
  type productFormType,
} from "@/lib/zodSchema";
import { toDateTimeLocalIST } from "@/lib/deals";
import { createProduct, updateProduct } from "@/server/admin/catalog";

type ProductFormProps = {
  mode: "create" | "edit";
  productId?: string;
  initialData?: {
    name: string;
    description: string;
    basePrice: string;
    discountPercent: number;
    discountStartsAt: string | null;
    discountEndsAt: string | null;
    brand: string;
    categoryId: string;
    isActive: boolean;
    images: { url: string; alt: string | null }[];
    variants: { name: string; stock: number }[];
  };
  categories: { id: string; name: string }[];
};

const ProductForm = ({
  mode,
  productId,
  initialData,
  categories,
}: ProductFormProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");
  const [isFreePriceOpen, setIsFreePriceOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<productFormType | null>(
    null,
  );
  const [liveCategories, setLiveCategories] = useState(categories);

  const methods = useForm<productFormInputType, undefined, productFormType>({
    resolver: zodResolver(productFormSchema),
    mode: "all",
    defaultValues:
      initialData ?
        {
          name: initialData.name,
          description: initialData.description,
          basePrice: Number(initialData.basePrice),
          discountPercent: initialData.discountPercent ?? 0,
          discountStartsAt: toDateTimeLocalIST(initialData.discountStartsAt),
          discountEndsAt: toDateTimeLocalIST(initialData.discountEndsAt),
          brand: initialData.brand,
          categoryId: initialData.categoryId,
          isActive: initialData.isActive,
          variants: initialData.variants.map((variant) => ({
            name: variant.name,
            stock: variant.stock,
          })),
          images: initialData.images.map((image, index) => ({
            url: image.url,
            alt: image.alt ?? "",
            sortOrder: index,
          })),
        }
      : {
          name: "",
          description: "",
          basePrice: 0,
          discountPercent: 0,
          discountStartsAt: "",
          discountEndsAt: "",
          brand: "",
          categoryId: "",
          isActive: true,
          variants: [{ name: "", stock: 0 }],
          images: [{ url: "", alt: "", sortOrder: 0 }],
        },
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors, isDirty },
  } = methods;

  const { guard, isOpen, confirmLeave, cancelLeave } =
    useNavigationGuard(isDirty);

  const detailsErrorCount = [
    "name",
    "description",
    "basePrice",
    "discountPercent",
    "discountStartsAt",
    "discountEndsAt",
    "brand",
    "categoryId",
  ].filter((key) => errors[key as keyof typeof errors]).length;
  const variantsErrorCount =
    Array.isArray(errors.variants) ? errors.variants.filter(Boolean).length : 0;
  const imagesErrorCount =
    Array.isArray(errors.images) ? errors.images.filter(Boolean).length : 0;

  const isDetails = activeTab === "details";
  const isVariants = activeTab === "variants";
  const isImages = activeTab === "images";

  const goNext = () => setActiveTab(isDetails ? "variants" : "images");
  const goBack = () => setActiveTab(isVariants ? "details" : "variants");

  const handleCategoryCreated = (newCat: { id: string; name: string }) => {
    setLiveCategories((prev) =>
      [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)),
    );
    methods.setValue("categoryId", newCat.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const doSubmit = async (values: productFormType) => {
    const result =
      mode === "create" ?
        await createProduct(values)
      : await updateProduct(productId!, values);

    if (result.ok) {
      toast.add({
        title: mode === "create" ? "Product created" : "Product updated",
        type: "success",
      });
      methods.reset({
        ...values,
        discountStartsAt: toDateTimeLocalIST(values.discountStartsAt),
        discountEndsAt: toDateTimeLocalIST(values.discountEndsAt),
      });
      router.replace("/admin/products" as Route);
      return;
    }

    toast.add({
      title:
        result.error === "FORBIDDEN" ?
          "You do not have permission to manage products"
        : result.error === "INVALID_INPUT" ? "Please check the form for errors"
        : result.error === "NOT_FOUND" ? "Product not found"
        : "Something went wrong",
      type: "error",
    });
  };

  const onSubmit = async (values: productFormType) => {
    if (values.basePrice === 0) {
      setPendingValues(values);
      setIsFreePriceOpen(true);
      return;
    }
    await doSubmit(values);
  };

  const confirmFreePrice = async () => {
    if (!pendingValues) return;
    setIsFreePriceOpen(false);
    await doSubmit(pendingValues);
    setPendingValues(null);
  };

  const cancelFreePrice = () => {
    setIsFreePriceOpen(false);
    setPendingValues(null);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">
              Details
              {detailsErrorCount > 0 && (
                <Badge variant="destructive">{detailsErrorCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="variants">
              Variants
              {variantsErrorCount > 0 && (
                <Badge variant="destructive">{variantsErrorCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="images">
              Images
              {imagesErrorCount > 0 && (
                <Badge variant="destructive">{imagesErrorCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <ProductDetailsFields
              categories={liveCategories}
              onCategoryCreated={handleCategoryCreated}
            />
          </TabsContent>
          <TabsContent value="variants">
            <ProductVariantsFields />
          </TabsContent>
          <TabsContent value="images">
            <ProductImagesFields />
          </TabsContent>
        </Tabs>

        <div className="bg-background/95 sticky bottom-0 z-10 flex items-center justify-between gap-2 p-4 backdrop-blur">
          <div>
            {isDetails ?
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() =>
                  guard(() => router.push("/admin/products" as Route))
                }>
                Cancel
              </Button>
            : <Button
                type="button"
                variant="outline"
                onClick={goBack}>
                Back
              </Button>
            }
          </div>
          <div>
            {isDetails && (
              <Button
                type="button"
                onClick={goNext}>
                Next: Variants
              </Button>
            )}
            {isVariants && (
              <Button
                type="button"
                onClick={goNext}>
                Next: Images
              </Button>
            )}
            {isImages && (
              <Button
                type="submit"
                disabled={isSubmitting || (mode === "edit" && !isDirty)}>
                {isSubmitting && (
                  <Loader2Icon
                    data-icon="inline-start"
                    className="animate-spin"
                    aria-hidden="true"
                  />
                )}
                {mode === "create" ? "Create Product" : "Save changes"}
              </Button>
            )}
          </div>
        </div>

        <AlertDialog
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) cancelLeave();
          }}>
          <AlertDialogContent>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Leaving now will discard them.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep editing</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={confirmLeave}>
                Leave
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={isFreePriceOpen}
          onOpenChange={(open) => {
            if (!open) cancelFreePrice();
          }}>
          <AlertDialogContent>
            <AlertDialogTitle>List product for free?</AlertDialogTitle>
            <AlertDialogDescription>
              Base price is ₹0. The product will be listed for free. Continue?
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelFreePrice}>
                Change price
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmFreePrice}>
                List for free
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </FormProvider>
  );
};

export default ProductForm;
