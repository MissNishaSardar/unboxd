"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@generated/prisma/client";
import prisma from "@/lib/dbClient/prisma";
import { requireAdmin } from "@/lib/guard";
import { storage } from "@/lib/storage/adapter";
import { slugify } from "@/lib/utils";
import { productFormSchema } from "@/lib/zodSchema";

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
    categoryId,
    isActive,
    featured,
    variants,
    images,
  } = parsed.data;

  try {
    const { slug, result: product } = await withUniqueSlug(
      parsed.data.slug || name,
      (candidate) =>
        prisma.product.create({
          data: {
            name,
            slug: candidate,
            description,
            basePrice: new Prisma.Decimal(basePrice),
            categoryId,
            isActive,
            featured,
            variants: {
              create: variants.map((variant) => ({
                sku: variant.sku.trim(),
                name: variant.name,
                priceDiff: new Prisma.Decimal(variant.priceDiff),
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
        }),
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
    categoryId,
    isActive,
    featured,
    variants,
    images,
  } = parsed.data;

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: { select: { id: true, sku: true } },
        images: { select: { url: true } },
      },
    });
    if (!existing) {
      return { ok: false, error: "NOT_FOUND" };
    }

    const oldImageUrls = existing.images.map((image) => image.url);
    const newImageUrls = images.map((image) => image.url);

    const { slug } = await withUniqueSlug(
      parsed.data.slug || name,
      (candidate) =>
        prisma.$transaction(async (tx) => {
          const submittedSkus = variants.map((variant) => variant.sku.trim());
          const existingBySku = new Map(
            existing.variants.map((variant) => [variant.sku, variant]),
          );

          const toDelete = existing.variants.filter(
            (variant) => !submittedSkus.includes(variant.sku),
          );
          if (toDelete.length > 0) {
            const referenced = await tx.orderItem.findMany({
              where: {
                variantId: { in: toDelete.map((variant) => variant.id) },
              },
              select: { variantId: true },
            });
            const referencedIds = new Set(
              referenced.map((item) => item.variantId),
            );
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
            const existingVariant = existingBySku.get(variant.sku.trim());
            if (existingVariant) {
              await tx.productVariant.update({
                where: { id: existingVariant.id },
                data: {
                  name: variant.name,
                  priceDiff: new Prisma.Decimal(variant.priceDiff),
                  stock: variant.stock,
                },
              });
            } else {
              await tx.productVariant.create({
                data: {
                  productId: id,
                  sku: variant.sku.trim(),
                  name: variant.name,
                  priceDiff: new Prisma.Decimal(variant.priceDiff),
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
              slug: candidate,
              description,
              basePrice: new Prisma.Decimal(basePrice),
              categoryId,
              isActive,
              featured,
            },
          });
        }),
    );

    const orphaned = oldImageUrls.filter((url) => !newImageUrls.includes(url));
    await Promise.all(
      orphaned.map((url) =>
        storage.delete(url).catch((e) => {
          console.error("Failed to delete upload", url, e);
        }),
      ),
    );

    revalidateTag("products", "max");
    revalidatePath("/products/[slug]", "page");
    return { ok: true, id, slug };
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
