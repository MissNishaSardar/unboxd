"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import { productCardInclude, toProductCardData } from "@/server/catalog";
import { getActiveSalePercent } from "@/server/deals";

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("UNAUTHORIZED");
  return session.user;
}

export async function toggleWishlist(productId: string) {
  const user = await requireUser();
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  return true;
}

export async function getWishlistIds() {
  const user = await requireUser();
  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    select: { productId: true },
  });
  return items.map((item) => item.productId);
}

export async function getProductsByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: uniqueIds }, isActive: true },
    include: productCardInclude,
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  const salePercent = await getActiveSalePercent();
  return uniqueIds
    .map((id) => byId.get(id))
    .filter((product): product is NonNullable<typeof product> =>
      Boolean(product),
    )
    .map((product) => toProductCardData(product, salePercent));
}
