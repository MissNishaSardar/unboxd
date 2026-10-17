"use server";

import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import { getActiveSalePercent } from "@/server/deals";
import { canTransition, isWithinReturnWindow } from "@/lib/orders/status";
import { restockItems } from "@/lib/orders/restock";
import {
  getPlaceholderPhotoUrl,
  resolveProductImageUrl,
} from "@/lib/placeholder";
import {
  activeDiscountPercent,
  combineDiscountPercent,
  effectivePrice,
  mrp,
} from "@/lib/pricing";
import { cancelOrderSchema } from "@/lib/zodSchema";
import { getStoreSettings } from "@/server/admin/settings";
import type { AddToCartInput } from "@/lib/cart/atoms";

const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED"];

export type CancelOrderResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "UNAUTHENTICATED"
        | "NOT_FOUND"
        | "INVALID_TRANSITION"
        | "INVALID_INPUT"
        | "SERVER_ERROR";
    };

export type ConfirmReceiptResult =
  | { ok: true }
  | {
      ok: false;
      error:
        "UNAUTHENTICATED" | "NOT_FOUND" | "INVALID_TRANSITION" | "SERVER_ERROR";
    };

export type RequestReturnResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "UNAUTHENTICATED"
        | "NOT_FOUND"
        | "INVALID_TRANSITION"
        | "RETURN_WINDOW_EXPIRED"
        | "SERVER_ERROR";
    };

class NotFoundError extends Error {}
class InvalidTransitionError extends Error {}
class ReturnWindowExpiredError extends Error {}

export async function cancelOrder(
  orderId: string,
  input: unknown,
): Promise<CancelOrderResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const parsed = cancelOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const { reason, note } = parsed.data;

  try {
    await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findFirst({
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
          data: {
            status: "CANCELLED",
            statusUpdatedAt: new Date(),
            cancelReason: reason,
            cancelNote: note?.trim() ? note.trim() : null,
            cancelledAt: new Date(),
            cancelledBy: session.user.id,
          },
        });
      },
      { maxWait: 5000, timeout: 10000 },
    );

    revalidateTag("products", "max");
    revalidatePath("/orders", "page");
    revalidatePath(`/orders/${orderId}`, "page");
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

export async function confirmReceipt(
  orderId: string,
): Promise<ConfirmReceiptResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findFirst({
          where: { id: orderId, userId: session.user.id },
        });
        if (!order) throw new NotFoundError();
        if (!canTransition(order.status, "DELIVERED")) {
          throw new InvalidTransitionError();
        }

        await tx.order.update({
          where: { id: orderId },
          data: { status: "DELIVERED", statusUpdatedAt: new Date() },
        });
      },
      { maxWait: 5000, timeout: 10000 },
    );

    revalidateTag("products", "max");
    revalidatePath("/orders", "page");
    revalidatePath(`/orders/${orderId}`, "page");
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
    console.error("confirmReceipt failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function requestReturn(
  orderId: string,
): Promise<RequestReturnResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findFirst({
          where: { id: orderId, userId: session.user.id },
          include: { items: { select: { variantId: true, quantity: true } } },
        });
        if (!order) throw new NotFoundError();
        if (!canTransition(order.status, "RETURNED")) {
          throw new InvalidTransitionError();
        }
        const { returnWindowDays } = await getStoreSettings();
        const deliveredAt = order.statusUpdatedAt ?? order.createdAt;
        if (!isWithinReturnWindow(deliveredAt, returnWindowDays)) {
          throw new ReturnWindowExpiredError();
        }

        await restockItems(tx, order.items);

        await tx.order.update({
          where: { id: orderId },
          data: { status: "RETURNED", statusUpdatedAt: new Date() },
        });
      },
      { maxWait: 5000, timeout: 10000 },
    );

    revalidateTag("products", "max");
    revalidatePath("/orders", "page");
    revalidatePath(`/orders/${orderId}`, "page");
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
    if (e instanceof ReturnWindowExpiredError) {
      return { ok: false, error: "RETURN_WINDOW_EXPIRED" };
    }
    console.error("requestReturn failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export type BuyAgainItem = AddToCartInput & { quantity: number };

export type GetBuyAgainItemsResult =
  | {
      ok: true;
      items: BuyAgainItem[];
      skipped: { name: string; reason: string }[];
    }
  | { ok: false; error: "UNAUTHENTICATED" | "NOT_FOUND" | "SERVER_ERROR" };

export async function getBuyAgainItems(
  orderId: string,
): Promise<GetBuyAgainItemsResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      include: { items: true },
    });
    if (!order || order.items.length === 0) {
      return { ok: false, error: "NOT_FOUND" };
    }

    const variantIds = order.items
      .map((item) => item.variantId)
      .filter((id): id is string => id !== null);
    const salePercent = await getActiveSalePercent();
    const variants =
      variantIds.length > 0 ?
        await prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: "asc" }, take: 1 },
              },
            },
          },
        })
      : [];
    const variantById = new Map(
      variants.map((variant) => [variant.id, variant]),
    );

    const items: BuyAgainItem[] = [];
    const skipped: { name: string; reason: string }[] = [];
    for (const item of order.items) {
      const variant =
        item.variantId ? variantById.get(item.variantId) : undefined;
      if (!variant) {
        skipped.push({
          name: item.nameSnapshot,
          reason: "No longer available",
        });
        continue;
      }
      const product = variant.product;
      if (!product.isActive) {
        skipped.push({
          name: item.nameSnapshot,
          reason: "No longer available",
        });
        continue;
      }
      if (variant.stock <= 0) {
        skipped.push({ name: item.nameSnapshot, reason: "Out of stock" });
        continue;
      }
      const basePrice = Number(product.basePrice);
      const priceDiff = Number(variant.priceDiff);
      items.push({
        productId: product.id,
        sku: variant.sku,
        slug: product.slug,
        name: product.name,
        variantName: variant.name,
        price: effectivePrice(
          basePrice,
          priceDiff,
          combineDiscountPercent(
            activeDiscountPercent(
              {
                discountPercent: product.discountPercent ?? 0,
                discountStartsAt: product.discountStartsAt,
                discountEndsAt: product.discountEndsAt,
              },
              Date.now(),
            ),
            salePercent,
          ),
        ),
        mrp: mrp(basePrice, priceDiff),
        image:
          product.images[0] ?
            resolveProductImageUrl(product.images[0].url, product.slug, 0)
          : getPlaceholderPhotoUrl(product.slug),
        maxStock: variant.stock,
        quantity: Math.min(item.quantity, variant.stock),
      });
    }

    return { ok: true, items, skipped };
  } catch (e) {
    console.error("getBuyAgainItems failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
