"use server";

import { cache } from "react";
import { revalidatePath, revalidateTag } from "next/cache";
import { connection } from "next/server";
import prisma from "@/lib/dbClient/prisma";
import { requireAdmin } from "@/lib/guard";
import { flashSaleSchema } from "@/lib/zodSchema";
import { getStoreSettings } from "@/server/admin/settings";

export type FlashSaleData = {
  id: string;
  name: string;
  discountPercent: number;
  startsAt: string | null;
  endsAt: string | null;
  bannerText: string;
  bannerEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const toData = (row: {
  id: string;
  name: string;
  discountPercent: number;
  startsAt: Date | null;
  endsAt: Date | null;
  bannerText: string;
  bannerEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): FlashSaleData => ({
  id: row.id,
  name: row.name,
  discountPercent: row.discountPercent,
  startsAt: row.startsAt ? row.startsAt.toISOString() : null,
  endsAt: row.endsAt ? row.endsAt.toISOString() : null,
  bannerText: row.bannerText,
  bannerEnabled: row.bannerEnabled,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const refreshStorefront = () => {
  revalidateTag("products", "max");
  revalidatePath("/", "layout");
  revalidatePath("/admin/deals", "page");
};

export const getActiveSalePercent = cache(async (): Promise<number> => {
  await connection();
  try {
    const now = new Date();
    const sale = await prisma.flashSale.findFirst({
      where: {
        isActive: true,
        discountPercent: { gt: 0 },
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      orderBy: { discountPercent: "desc" },
    });
    return sale?.discountPercent ?? 0;
  } catch (e) {
    console.error("getActiveSalePercent failed", e);
    return 0;
  }
});

export type ActiveBanner = {
  name: string;
  text: string;
  discountPercent: number;
  endsAt: string | null;
} | null;

export const getActiveBanner = cache(async (): Promise<ActiveBanner> => {
  await connection();
  const now = new Date();
  const row = await prisma.flashSale.findFirst({
    where: {
      isActive: true,
      bannerEnabled: true,
      bannerText: { not: "" },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
    orderBy: [{ discountPercent: "desc" }, { startsAt: "desc" }],
  });
  if (!row) return null;
  return {
    name: row.name,
    text: row.bannerText,
    discountPercent: row.discountPercent,
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
  };
});

export type FlashSaleListResult =
  { ok: true; sales: FlashSaleData[] } | { ok: false; error: "FORBIDDEN" };

export async function getFlashSales(): Promise<FlashSaleListResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }
  const rows = await prisma.flashSale.findMany({
    orderBy: [{ isActive: "desc" }, { startsAt: "desc" }],
  });
  return { ok: true, sales: rows.map(toData) };
}

type OverlapRow = { startsAt: Date | null; endsAt: Date | null };

function windowsOverlap(
  input: { startsAt?: Date; endsAt?: Date },
  row: OverlapRow,
): boolean {
  const start = input.startsAt ? input.startsAt.getTime() : -Infinity;
  const end = input.endsAt ? input.endsAt.getTime() : Infinity;
  const rowStart = row.startsAt ? row.startsAt.getTime() : -Infinity;
  const rowEnd = row.endsAt ? row.endsAt.getTime() : Infinity;
  return start < rowEnd && rowStart < end;
}

async function findOverlap(
  input: { startsAt?: Date; endsAt?: Date },
  excludeId?: string,
) {
  const rows = await prisma.flashSale.findMany({
    where: {
      isActive: true,
      discountPercent: { gt: 0 },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return rows.find((row) => windowsOverlap(input, row)) ?? null;
}

export type FlashSaleResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error:
        | "FORBIDDEN"
        | "INVALID_INPUT"
        | "OVERLAP"
        | "NOT_FOUND"
        | "SERVER_ERROR";
    };

export async function createSale(input: unknown): Promise<FlashSaleResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }
  const parsed = flashSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const { maxDiscountPercent } = await getStoreSettings();
  if (parsed.data.discountPercent > maxDiscountPercent) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  if (parsed.data.isActive && parsed.data.discountPercent > 0) {
    const clash = await findOverlap({
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
    });
    if (clash) return { ok: false, error: "OVERLAP" };
  }
  try {
    const row = await prisma.$transaction(async (tx) => {
      if (parsed.data.isActive && parsed.data.discountPercent > 0) {
        const rivals = await tx.flashSale.findMany({
          where: { isActive: true, discountPercent: { gt: 0 } },
        });
        const clash = rivals.find((r) =>
          windowsOverlap(
            { startsAt: parsed.data.startsAt, endsAt: parsed.data.endsAt },
            r,
          ),
        );
        if (clash) throw new Error("OVERLAP_GUARD");
      }
      return tx.flashSale.create({ data: { ...parsed.data } });
    });
    refreshStorefront();
    return { ok: true, id: row.id };
  } catch (e) {
    if (e instanceof Error && e.message === "OVERLAP_GUARD") {
      return { ok: false, error: "OVERLAP" };
    }
    console.error("createSale failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function updateSale(
  id: string,
  input: unknown,
): Promise<FlashSaleResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }
  const parsed = flashSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const { maxDiscountPercent } = await getStoreSettings();
  if (parsed.data.discountPercent > maxDiscountPercent) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  if (parsed.data.isActive && parsed.data.discountPercent > 0) {
    const clash = await findOverlap(
      { startsAt: parsed.data.startsAt, endsAt: parsed.data.endsAt },
      id,
    );
    if (clash) return { ok: false, error: "OVERLAP" };
  }
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.flashSale.findUnique({ where: { id } });
      if (!existing) throw new Error("NOT_FOUND_GUARD");
      if (parsed.data.isActive && parsed.data.discountPercent > 0) {
        const rivals = await tx.flashSale.findMany({
          where: {
            isActive: true,
            discountPercent: { gt: 0 },
            id: { not: id },
          },
        });
        const clash = rivals.find((r) =>
          windowsOverlap(
            { startsAt: parsed.data.startsAt, endsAt: parsed.data.endsAt },
            r,
          ),
        );
        if (clash) throw new Error("OVERLAP_GUARD");
      }
      await tx.flashSale.update({
        where: { id },
        data: {
          ...parsed.data,
          startsAt: parsed.data.startsAt ?? null,
          endsAt: parsed.data.endsAt ?? null,
        },
      });
    });
    refreshStorefront();
    return { ok: true, id };
  } catch (e) {
    if (e instanceof Error && e.message === "OVERLAP_GUARD") {
      return { ok: false, error: "OVERLAP" };
    }
    if (e instanceof Error && e.message === "NOT_FOUND_GUARD") {
      return { ok: false, error: "NOT_FOUND" };
    }
    console.error("updateSale failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function endSaleNow(id: string): Promise<FlashSaleResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }
  try {
    const existing = await prisma.flashSale.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "NOT_FOUND" };
    await prisma.flashSale.update({
      where: { id },
      data: { endsAt: new Date() },
    });
    refreshStorefront();
    return { ok: true, id };
  } catch (e) {
    console.error("endSaleNow failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function duplicateSale(id: string): Promise<FlashSaleResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }
  try {
    const existing = await prisma.flashSale.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "NOT_FOUND" };
    const root =
      existing.name.replace(/ copy( \d+)?$/, "").trim() || existing.name;
    const siblings = await prisma.flashSale.findMany({
      where: { name: { startsWith: root.slice(0, 70) } },
      select: { name: true },
    });
    const taken = new Set(siblings.map((sibling) => sibling.name));
    let count = 1;
    let name = "";
    while (count <= 999) {
      const suffix = count === 1 ? " copy" : ` copy ${count}`;
      name = `${root.slice(0, 80 - suffix.length)}${suffix}`;
      if (!taken.has(name)) break;
      count += 1;
    }
    const row = await prisma.flashSale.create({
      data: {
        name,
        discountPercent: existing.discountPercent,
        startsAt: existing.startsAt,
        endsAt: existing.endsAt,
        bannerText: existing.bannerText,
        bannerEnabled: existing.bannerEnabled,
        isActive: false,
      },
    });
    refreshStorefront();
    return { ok: true, id: row.id };
  } catch (e) {
    console.error("duplicateSale failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function deleteSale(id: string): Promise<FlashSaleResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }
  try {
    const existing = await prisma.flashSale.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "NOT_FOUND" };
    await prisma.flashSale.delete({ where: { id } });
    refreshStorefront();
    return { ok: true, id };
  } catch (e) {
    console.error("deleteSale failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
