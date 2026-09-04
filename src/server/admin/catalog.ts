"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@generated/prisma/client";
import prisma from "@/lib/dbClient/prisma";
import { requireAdmin } from "@/lib/guard";
import { storage } from "@/lib/storage/adapter";
import { brandToSlug } from "@/lib/brand";
import { slugify } from "@/lib/utils";
import { productFormSchema, updateVariantStockSchema } from "@/lib/zodSchema";

export type AdminProductResult =
  | { ok: true; id: string; slug: string }
  | {
      ok: false;
      error: "FORBIDDEN" | "INVALID_INPUT" | "NOT_FOUND" | "SERVER_ERROR";
    };

function isSlugConflict(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === "P2002" &&
    Array.isArray(e.meta?.target) &&
    e.meta.target.includes("slug")
  );
}

async function withUniqueSlug<T>(
  base: string,
  run: (slug: string) => Promise<T>,
): Promise<{ slug: string; result: T }> {
  const candidate = slugify(base) || "product";
  let slug = candidate;
  let suffix = 2;
  for (;;) {
    try {
      return { slug, result: await run(slug) };
    } catch (e) {
      if (!isSlugConflict(e)) throw e;
      slug = `${candidate}-${suffix}`;
      suffix += 1;
    }
  }
}

type SkuDb = {
  productVariant: {
    findUnique: (args: {
      where: { sku: string };
    }) => Promise<{ sku: string } | null>;
  };
};

async function makeSku(db: SkuDb, base: string): Promise<string> {
  const candidate = slugify(base) || "variant";
  let sku = candidate;
  let suffix = 2;
  while (await db.productVariant.findUnique({ where: { sku } })) {
    sku = `${candidate}-${suffix}`;
    suffix += 1;
  }
  return sku;
}

export async function createProduct(
  input: unknown,
): Promise<AdminProductResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const {
    name,
    description,
    basePrice,
    brand,
    categoryId,
    isActive,
    variants,
    images,
  } = parsed.data;

  try {
    const { slug, result: product } = await withUniqueSlug(
      name,
      async (candidate) => {
        const skus = await Promise.all(
          variants.map((variant) =>
            makeSku(prisma, `${candidate}-${variant.name}`),
          ),
        );
        return prisma.product.create({
          data: {
            name,
            slug: candidate,
            description,
            basePrice: new Prisma.Decimal(basePrice),
            brand,
            brandSlug: brandToSlug(brand),
            categoryId,
            isActive,
            variants: {
              create: variants.map((variant, index) => ({
                sku: skus[index],
                name: variant.name,
                priceDiff: new Prisma.Decimal(0),
                stock: variant.stock,
              })),
            },
            images: {
              create: images.map((image, index) => ({
                url: image.url,
                alt: image.alt || null,
                sortOrder: index,
              })),
            },
          },
        });
      },
    );

    revalidateTag("products", "max");
    revalidatePath("/products/[slug]", "page");
    return { ok: true, id: product.id, slug };
  } catch (e) {
    console.error("createProduct failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function updateProduct(
  id: string,
  input: unknown,
): Promise<AdminProductResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const {
    name,
    description,
    basePrice,
    brand,
    categoryId,
    isActive,
    variants,
    images,
  } = parsed.data;

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: { select: { id: true, name: true } },
        images: { select: { url: true } },
      },
    });
    if (!existing) {
      return { ok: false, error: "NOT_FOUND" };
    }

    const oldImageUrls = existing.images.map((image) => image.url);
    const newImageUrls = images.map((image) => image.url);

    await prisma.$transaction(async (tx) => {
      const submittedNames = variants.map((variant) =>
        variant.name.trim().toLowerCase(),
      );
      const existingByName = new Map(
        existing.variants.map((variant) => [
          variant.name.trim().toLowerCase(),
          variant,
        ]),
      );

      const toDelete = existing.variants.filter(
        (variant) =>
          !submittedNames.includes(variant.name.trim().toLowerCase()),
      );
      if (toDelete.length > 0) {
        const referenced = await tx.orderItem.findMany({
          where: {
            variantId: { in: toDelete.map((variant) => variant.id) },
          },
          select: { variantId: true },
        });
        const referencedIds = new Set(referenced.map((item) => item.variantId));
        const deletable = toDelete.filter(
          (variant) => !referencedIds.has(variant.id),
        );
        if (deletable.length > 0) {
          await tx.productVariant.deleteMany({
            where: { id: { in: deletable.map((variant) => variant.id) } },
          });
        }
      }

      for (const variant of variants) {
        const existingVariant = existingByName.get(
          variant.name.trim().toLowerCase(),
        );
        if (existingVariant) {
          await tx.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              stock: variant.stock,
              priceDiff: new Prisma.Decimal(0),
            },
          });
        } else {
          const sku = await makeSku(tx, `${existing.slug}-${variant.name}`);
          await tx.productVariant.create({
            data: {
              productId: id,
              sku,
              name: variant.name,
              priceDiff: new Prisma.Decimal(0),
              stock: variant.stock,
            },
          });
        }
      }

      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productImage.createMany({
        data: images.map((image, index) => ({
          productId: id,
          url: image.url,
          alt: image.alt || null,
          sortOrder: index,
        })),
      });

      await tx.product.update({
        where: { id },
        data: {
          name,
          description,
          basePrice: new Prisma.Decimal(basePrice),
          brand,
          brandSlug: brandToSlug(brand),
          categoryId,
          isActive,
        },
      });
    });

    const orphaned = oldImageUrls.filter(
      (url) => url.startsWith("/uploads/") && !newImageUrls.includes(url),
    );
    await Promise.all(
      orphaned.map((url) =>
        storage.delete(url).catch((e) => {
          console.error("Failed to delete upload", url, e);
        }),
      ),
    );

    revalidateTag("products", "max");
    revalidatePath("/products/[slug]", "page");
    return { ok: true, id, slug: existing.slug };
  } catch (e) {
    console.error("updateProduct failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function deleteProduct(id: string): Promise<AdminProductResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, error: "NOT_FOUND" };
    }
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    revalidateTag("products", "max");
    revalidatePath("/products/[slug]", "page");
    return { ok: true, id: product.id, slug: product.slug };
  } catch (e) {
    console.error("deleteProduct failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function restoreProduct(id: string): Promise<AdminProductResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, error: "NOT_FOUND" };
    }
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: true },
    });

    revalidateTag("products", "max");
    revalidatePath("/products/[slug]", "page");
    return { ok: true, id: product.id, slug: product.slug };
  } catch (e) {
    console.error("restoreProduct failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export type AdminVariantStockResult =
  | { ok: true; id: string; stock: number }
  | {
      ok: false;
      error: "FORBIDDEN" | "INVALID_INPUT" | "NOT_FOUND" | "SERVER_ERROR";
    };

export async function updateVariantStock(
  id: string,
  input: unknown,
): Promise<AdminVariantStockResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = updateVariantStockSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  try {
    const existing = await prisma.productVariant.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, error: "NOT_FOUND" };
    }
    const variant = await prisma.productVariant.update({
      where: { id },
      data: { stock: parsed.data.stock },
    });

    revalidateTag("products", "max");
    revalidatePath("/admin/inventory", "page");
    return { ok: true, id: variant.id, stock: variant.stock };
  } catch (e) {
    console.error("updateVariantStock failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
