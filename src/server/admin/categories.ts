"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@generated/prisma/client";
import prisma from "@/lib/dbClient/prisma";
import { requireAdmin } from "@/lib/guard";
import { slugify } from "@/lib/utils";
import {
  categoryFormSchema,
  moveCategoryToSchema,
  reassignCategorySchema,
} from "@/lib/zodSchema";

export type AdminCategoryResult =
  | { ok: true; id: string; slug: string }
  | {
      ok: false;
      error:
        | "FORBIDDEN"
        | "INVALID_INPUT"
        | "NOT_FOUND"
        | "HAS_CHILDREN"
        | "HAS_PRODUCTS"
        | "SERVER_ERROR";
    };

export type AdminCascadeResult =
  | { ok: true; deletedCategories: number; hiddenProducts: number }
  | { ok: false; error: "FORBIDDEN" | "NOT_FOUND" | "SERVER_ERROR" };

export type CategorySubtreeNode = {
  id: string;
  name: string;
  productCount: number;
  children: CategorySubtreeNode[];
};

export type AdminCategorySubtreeResult =
  | { ok: true; subtree: CategorySubtreeNode }
  | { ok: false; error: "FORBIDDEN" | "NOT_FOUND" | "SERVER_ERROR" };

class NotFoundError extends Error {}
class HasChildrenError extends Error {}
class HasProductsError extends Error {}
class InvalidInputError extends Error {}

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
  const candidate = slugify(base) || "category";
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

async function getParentByIdMap(
  tx: Prisma.TransactionClient,
): Promise<Map<string, string | null>> {
  const all = await tx.category.findMany({
    where: { deletedAt: null },
    select: { id: true, parentId: true },
  });
  return new Map(all.map((category) => [category.id, category.parentId]));
}

function isDescendantOf(
  parentById: Map<string, string | null>,
  ancestorId: string,
  candidateId: string,
): boolean {
  let current = candidateId;
  const seen = new Set<string>();
  while (current) {
    if (current === ancestorId) return true;
    if (seen.has(current)) return false;
    seen.add(current);
    current = parentById.get(current) ?? "";
  }
  return false;
}

export async function createCategory(
  input: unknown,
): Promise<AdminCategoryResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const { name, parentId } = parsed.data;

  try {
    const { slug, result: category } = await withUniqueSlug(
      name,
      async (candidate) =>
        prisma.$transaction(
          async (tx) => {
            if (parentId) {
              const parent = await tx.category.findUnique({
                where: { id: parentId },
                select: { id: true },
              });
              if (!parent) {
                throw new InvalidInputError();
              }
            }
            // The create form has no position field, so new categories
            // always append last. Max plus one keeps a fresh row off an
            // occupied spot when earlier deletes or manual edits left gaps.
            const scope = parentId ? { parentId } : { parentId: null };
            const { _max } = await tx.category.aggregate({
              where: scope,
              _max: { position: true },
            });
            return tx.category.create({
              data: {
                name,
                slug: candidate,
                position: (_max.position ?? -1) + 1,
                ...(parentId ? { parentId } : {}),
              },
            });
          },
          { maxWait: 5000, timeout: 10000 },
        ),
    );

    revalidateTag("products", "max");
    revalidatePath("/admin/categories");
    return { ok: true, id: category.id, slug };
  } catch (e) {
    if (e instanceof InvalidInputError) {
      return { ok: false, error: "INVALID_INPUT" };
    }
    console.error("createCategory failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function updateCategory(
  id: string,
  input: unknown,
): Promise<AdminCategoryResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const { name, parentId, position } = parsed.data;

  try {
    const category = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.category.findUnique({
          where: { id },
          select: { id: true, slug: true },
        });
        if (!existing) {
          throw new NotFoundError();
        }

        if (parentId) {
          if (parentId === id) {
            throw new InvalidInputError();
          }
          const parent = await tx.category.findUnique({
            where: { id: parentId },
            select: { id: true },
          });
          if (!parent) {
            throw new InvalidInputError();
          }
          const parentById = await getParentByIdMap(tx);
          if (isDescendantOf(parentById, id, parentId)) {
            throw new InvalidInputError();
          }
        }

        return tx.category.update({
          where: { id },
          data: {
            name,
            position,
            ...(parentId ? { parentId } : { parentId: null }),
          },
        });
      },
      { maxWait: 5000, timeout: 10000 },
    );

    revalidateTag("products", "max");
    revalidatePath("/admin/categories");
    return { ok: true, id: category.id, slug: category.slug };
  } catch (e) {
    if (e instanceof NotFoundError) {
      return { ok: false, error: "NOT_FOUND" };
    }
    if (e instanceof InvalidInputError) {
      return { ok: false, error: "INVALID_INPUT" };
    }
    console.error("updateCategory failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export type AdminMoveToResult =
  | { ok: true; moved: boolean }
  | {
      ok: false;
      error: "FORBIDDEN" | "INVALID_INPUT" | "NOT_FOUND" | "SERVER_ERROR";
    };

export async function moveCategoryTo(
  id: string,
  input: unknown,
): Promise<AdminMoveToResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = moveCategoryToSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const { parentId, index } = parsed.data;

  try {
    const moved = await prisma.$transaction(
      async (tx) => {
        const target = await tx.category.findUnique({
          where: { id, deletedAt: null },
          select: { id: true, parentId: true },
        });
        if (!target) {
          throw new NotFoundError();
        }
        if (parentId === id) {
          throw new InvalidInputError();
        }
        if (parentId) {
          const parent = await tx.category.findUnique({
            where: { id: parentId, deletedAt: null },
            select: { id: true },
          });
          if (!parent) {
            throw new InvalidInputError();
          }
          const parentById = await getParentByIdMap(tx);
          if (isDescendantOf(parentById, id, parentId)) {
            throw new InvalidInputError();
          }
        }

        const orderBy = [
          { position: "asc" },
          { name: "asc" },
          { id: "asc" },
        ] as const;
        const scope = (scopeParentId: string | null) =>
          scopeParentId ? { parentId: scopeParentId } : { parentId: null };
        const oldSiblings = await tx.category.findMany({
          where: { ...scope(target.parentId), deletedAt: null },
          orderBy: [...orderBy],
          select: { id: true },
        });
        const newSiblings =
          target.parentId === parentId ?
            oldSiblings
          : await tx.category.findMany({
              where: { ...scope(parentId), deletedAt: null },
              orderBy: [...orderBy],
              select: { id: true },
            });
        const withoutTarget = newSiblings.filter((item) => item.id !== id);
        const clamped = Math.max(0, Math.min(index, withoutTarget.length));
        const next = [
          ...withoutTarget.slice(0, clamped),
          { id },
          ...withoutTarget.slice(clamped),
        ];
        const prevIds = newSiblings.map((item) => item.id);
        const nextIds = next.map((item) => item.id);
        const unchanged =
          prevIds.length === nextIds.length &&
          prevIds.every(
            (siblingId, position) => siblingId === nextIds[position],
          );
        if (unchanged) return false;

        if (target.parentId !== parentId) {
          const oldWithout = oldSiblings.filter((item) => item.id !== id);
          await Promise.all(
            oldWithout.map((sibling, position) =>
              tx.category.update({
                where: { id: sibling.id },
                data: { position },
              }),
            ),
          );
        }
        await Promise.all(
          next.map((sibling, position) =>
            tx.category.update({
              where: { id: sibling.id },
              data: {
                position,
                ...(sibling.id === id ? { parentId } : {}),
              },
            }),
          ),
        );
        return true;
      },
      { maxWait: 5000, timeout: 10000 },
    );

    if (moved) {
      revalidateTag("products", "max");
      revalidatePath("/admin/categories");
    }
    return { ok: true, moved };
  } catch (e) {
    if (e instanceof NotFoundError) {
      return { ok: false, error: "NOT_FOUND" };
    }
    if (e instanceof InvalidInputError) {
      return { ok: false, error: "INVALID_INPUT" };
    }
    console.error("moveCategoryTo failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function deleteCategory(id: string): Promise<AdminCategoryResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  try {
    const existing = await prisma.$transaction(
      async (tx) => {
        const category = await tx.category.findUnique({
          where: { id },
          select: {
            id: true,
            slug: true,
            _count: { select: { children: true, products: true } },
          },
        });
        if (!category) {
          throw new NotFoundError();
        }
        if (category._count.children > 0) {
          throw new HasChildrenError();
        }
        if (category._count.products > 0) {
          throw new HasProductsError();
        }
        await tx.category.delete({ where: { id } });
        return category;
      },
      { maxWait: 5000, timeout: 10000 },
    );

    revalidateTag("products", "max");
    revalidatePath("/admin/categories");
    return { ok: true, id: existing.id, slug: existing.slug };
  } catch (e) {
    if (e instanceof NotFoundError) {
      return { ok: false, error: "NOT_FOUND" };
    }
    if (e instanceof HasChildrenError) {
      return { ok: false, error: "HAS_CHILDREN" };
    }
    if (e instanceof HasProductsError) {
      return { ok: false, error: "HAS_PRODUCTS" };
    }
    console.error("deleteCategory failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function reassignAndDeleteCategory(
  categoryId: string,
  input: unknown,
): Promise<AdminCategoryResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = reassignCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const { targetCategoryId } = parsed.data;

  try {
    const existing = await prisma.$transaction(
      async (tx) => {
        const category = await tx.category.findUnique({
          where: { id: categoryId },
          select: {
            id: true,
            slug: true,
            _count: { select: { children: true } },
          },
        });
        if (!category) {
          throw new NotFoundError();
        }
        if (category._count.children > 0) {
          throw new HasChildrenError();
        }
        if (targetCategoryId === categoryId) {
          throw new InvalidInputError();
        }
        const target = await tx.category.findUnique({
          where: { id: targetCategoryId },
          select: { id: true },
        });
        if (!target) {
          throw new InvalidInputError();
        }
        await tx.product.updateMany({
          where: { categoryId },
          data: { categoryId: targetCategoryId },
        });
        await tx.category.delete({ where: { id: categoryId } });
        return category;
      },
      { maxWait: 5000, timeout: 10000 },
    );

    revalidateTag("products", "max");
    revalidatePath("/admin/categories");
    return { ok: true, id: existing.id, slug: existing.slug };
  } catch (e) {
    if (e instanceof NotFoundError) {
      return { ok: false, error: "NOT_FOUND" };
    }
    if (e instanceof HasChildrenError) {
      return { ok: false, error: "HAS_CHILDREN" };
    }
    if (e instanceof InvalidInputError) {
      return { ok: false, error: "INVALID_INPUT" };
    }
    console.error("reassignAndDeleteCategory failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function deleteCategoryCascade(
  categoryId: string,
): Promise<AdminCascadeResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const root = await tx.category.findUnique({
          where: { id: categoryId },
          select: { id: true },
        });
        if (!root) {
          throw new NotFoundError();
        }

        const all = await tx.category.findMany({
          select: { id: true, parentId: true },
        });
        const childrenByParent = new Map<string, string[]>();
        for (const category of all) {
          if (category.parentId) {
            const siblings = childrenByParent.get(category.parentId) ?? [];
            siblings.push(category.id);
            childrenByParent.set(category.parentId, siblings);
          }
        }

        const subtreeIds: string[] = [];
        const queue = [categoryId];
        while (queue.length > 0) {
          const current = queue.shift()!;
          subtreeIds.push(current);
          queue.push(...(childrenByParent.get(current) ?? []));
        }

        const hiddenProducts = await tx.product.updateMany({
          where: { categoryId: { in: subtreeIds } },
          data: { isActive: false },
        });
        await tx.category.updateMany({
          where: { id: { in: subtreeIds } },
          data: { deletedAt: new Date() },
        });

        return {
          deletedCategories: subtreeIds.length,
          hiddenProducts: hiddenProducts.count,
        };
      },
      { maxWait: 5000, timeout: 10000 },
    );

    revalidateTag("products", "max");
    revalidatePath("/admin/categories");
    return { ok: true, ...result };
  } catch (e) {
    if (e instanceof NotFoundError) {
      return { ok: false, error: "NOT_FOUND" };
    }
    console.error("deleteCategoryCascade failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function getCategorySubtreeForDelete(
  categoryId: string,
): Promise<AdminCategorySubtreeResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  try {
    const all = await prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ position: "asc" }, { name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        parentId: true,
        _count: { select: { products: true } },
      },
    });
    const byId = new Map(all.map((category) => [category.id, category]));
    const root = byId.get(categoryId);
    if (!root) {
      return { ok: false, error: "NOT_FOUND" };
    }

    const childrenByParent = new Map<string, typeof all>();
    for (const category of all) {
      if (category.parentId) {
        const siblings = childrenByParent.get(category.parentId) ?? [];
        siblings.push(category);
        childrenByParent.set(category.parentId, siblings);
      }
    }

    const build = (category: (typeof all)[number]): CategorySubtreeNode => ({
      id: category.id,
      name: category.name,
      productCount: category._count.products,
      children: (childrenByParent.get(category.id) ?? []).map(build),
    });

    return { ok: true, subtree: build(root) };
  } catch (e) {
    console.error("getCategorySubtreeForDelete failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
