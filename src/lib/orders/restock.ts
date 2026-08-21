import type { Prisma } from "@generated/prisma/client";

export async function restockItems(
  tx: Prisma.TransactionClient,
  items: { variantId: string | null; quantity: number }[],
) {
  for (const item of items) {
    if (!item.variantId) continue;
    await tx.productVariant.updateMany({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    });
  }
}
