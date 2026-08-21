"use server";

import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import { restockItems } from "@/lib/orders/restock";

const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED"];

export type CancelOrderResult =
  | { ok: true }
  | {
      ok: false;
      error:
        "UNAUTHENTICATED" | "NOT_FOUND" | "INVALID_TRANSITION" | "SERVER_ERROR";
    };

class NotFoundError extends Error {}
class InvalidTransitionError extends Error {}

export async function cancelOrder(orderId: string): Promise<CancelOrderResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId, userId: session.user.id },
          include: { items: { select: { variantId: true, quantity: true } } },
        });
        if (!order) throw new NotFoundError();
        if (!CANCELLABLE_STATUSES.includes(order.status)) {
          throw new InvalidTransitionError();
        }

        await restockItems(tx, order.items);

        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED", statusUpdatedAt: new Date() },
        });
      },
      { maxWait: 5000, timeout: 10000 },
    );

    revalidateTag("products", "max");
    revalidatePath("/orders", "page");
    revalidatePath(`/orders/${orderId}`, "page");
    revalidatePath("/dashboard", "page");
    revalidatePath("/admin/orders", "page");
    revalidatePath(`/admin/orders/${orderId}`, "page");
    return { ok: true };
  } catch (e) {
    if (e instanceof NotFoundError) {
      return { ok: false, error: "NOT_FOUND" };
    }
    if (e instanceof InvalidTransitionError) {
      return { ok: false, error: "INVALID_TRANSITION" };
    }
    console.error("cancelOrder failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
