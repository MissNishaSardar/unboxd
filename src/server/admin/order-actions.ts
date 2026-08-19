"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { Prisma } from "@generated/prisma/client";
import prisma from "@/lib/dbClient/prisma";
import { requireAdmin } from "@/lib/guard";
import { canTransition, isTerminalStatus } from "@/lib/orders/status";
import {
  bulkOrderStatusSchema,
  updateOrderStatusSchema,
} from "@/lib/zodSchema";

export type AdminOrderResult =
  | { ok: true; orderId: string; status: string }
  | {
      ok: false;
      error:
        | "FORBIDDEN"
        | "INVALID_INPUT"
        | "NOT_FOUND"
        | "INVALID_TRANSITION"
        | "SERVER_ERROR";
    };

export type AdminBulkOrderResult =
  | { ok: true; updated: number; skipped: number }
  | { ok: false; error: "FORBIDDEN" | "INVALID_INPUT" | "SERVER_ERROR" };

class NotFoundError extends Error {}
class InvalidTransitionError extends Error {}

async function restockItems(
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

export async function updateOrderStatus(
  orderId: string,
  input: unknown,
): Promise<AdminOrderResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const { status: nextStatus } = parsed.data;

  try {
    const order = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: { select: { variantId: true, quantity: true } } },
        });
        if (!existing) throw new NotFoundError();
        if (!canTransition(existing.status, nextStatus)) {
          throw new InvalidTransitionError();
        }

        if (isTerminalStatus(nextStatus)) {
          await restockItems(tx, existing.items);
        }

        return tx.order.update({
          where: { id: orderId },
          data: { status: nextStatus, statusUpdatedAt: new Date() },
        });
      },
      { maxWait: 5000, timeout: 10000 },
    );

    revalidateTag("products", "max");
    revalidatePath("/admin/orders", "page");
    revalidatePath(`/admin/orders/${orderId}`, "page");
    return { ok: true, orderId, status: order.status };
  } catch (e) {
    if (e instanceof NotFoundError) {
      return { ok: false, error: "NOT_FOUND" };
    }
    if (e instanceof InvalidTransitionError) {
      return { ok: false, error: "INVALID_TRANSITION" };
    }
    console.error("updateOrderStatus failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function bulkUpdateOrderStatus(
  input: unknown,
): Promise<AdminBulkOrderResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = bulkOrderStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const { orderIds, status: nextStatus } = parsed.data;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        let updated = 0;
        let skipped = 0;
        for (const orderId of orderIds) {
          const existing = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: { select: { variantId: true, quantity: true } } },
          });
          if (!existing || !canTransition(existing.status, nextStatus)) {
            skipped += 1;
            continue;
          }

          if (isTerminalStatus(nextStatus)) {
            await restockItems(tx, existing.items);
          }

          await tx.order.update({
            where: { id: orderId },
            data: { status: nextStatus, statusUpdatedAt: new Date() },
          });
          updated += 1;
        }
        return { updated, skipped };
      },
      { maxWait: 5000, timeout: 10000 },
    );

    revalidateTag("products", "max");
    revalidatePath("/admin/orders", "page");
    return { ok: true, ...result };
  } catch (e) {
    console.error("bulkUpdateOrderStatus failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
