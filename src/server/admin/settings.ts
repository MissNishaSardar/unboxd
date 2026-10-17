"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import prisma from "@/lib/dbClient/prisma";
import { requireAdmin } from "@/lib/guard";
import { storeSettingsSchema, storeSettingsType } from "@/lib/zodSchema";

export type StoreSettingsData = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  codEnabled: boolean;
  deliveryDays: number;
  lowStockThreshold: number;
  returnWindowDays: number;
  freeShippingThreshold: string;
  shippingFlatRate: string;
  maxDiscountPercent: number;
};

const toData = (row: {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  codEnabled: boolean;
  deliveryDays: number;
  lowStockThreshold: number;
  returnWindowDays: number;
  freeShippingThreshold: unknown;
  shippingFlatRate: unknown;
  maxDiscountPercent: number;
}): StoreSettingsData => ({
  storeName: row.storeName,
  supportEmail: row.supportEmail,
  supportPhone: row.supportPhone,
  codEnabled: row.codEnabled,
  deliveryDays: row.deliveryDays,
  lowStockThreshold: row.lowStockThreshold,
  returnWindowDays: row.returnWindowDays,
  freeShippingThreshold: String(row.freeShippingThreshold),
  shippingFlatRate: String(row.shippingFlatRate),
  maxDiscountPercent: row.maxDiscountPercent,
});

export const getStoreSettings = cache(async (): Promise<StoreSettingsData> => {
  // Every Prisma query calls crypto.randomUUID() internally, which is banned
  // during static prerender. Opt into request-time rendering up front so the
  // prerenderer bails to dynamic instead of throwing next-prerender-crypto.
  await connection();
  const row = await prisma.storeSettings.upsert({
    where: { id: "store" },
    update: {},
    create: { id: "store" },
  });
  return toData(row);
});

export type UpdateStoreSettingsResult =
  | { ok: true }
  | { ok: false; error: "FORBIDDEN" | "INVALID_INPUT" | "SERVER_ERROR" };

export async function updateStoreSettings(
  input: storeSettingsType,
): Promise<UpdateStoreSettingsResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = storeSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  try {
    await prisma.storeSettings.upsert({
      where: { id: "store" },
      update: { ...parsed.data },
      create: { id: "store", ...parsed.data },
    });
    revalidatePath("/admin/settings", "page");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("updateStoreSettings failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
