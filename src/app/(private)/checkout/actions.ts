"use server";

import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import type { Product, ProductVariant } from "@generated/prisma/client";
import { checkoutSchema } from "@/lib/zodSchema";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT_RATE,
} from "@/lib/cart/shipping";

const cartLineSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

const placeOrderInputSchema = z.object({
  address: checkoutSchema,
  cart: z.array(cartLineSchema).min(1, "Cart is empty"),
});

class OutOfStockError extends Error {}

export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | {
      ok: false;
      error:
        "UNAUTHENTICATED" | "OUT_OF_STOCK" | "INVALID_INPUT" | "SERVER_ERROR";
    };

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const parsed = placeOrderInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const { address, cart } = parsed.data;

  try {
    const order = await prisma.$transaction(
      async (tx) => {
        const variants: (ProductVariant & { product: Product })[] = [];
        for (const line of cart) {
          variants.push(
            await tx.productVariant.findUniqueOrThrow({
              where: { sku: line.sku },
              include: { product: true },
            }),
          );
        }

        for (const line of cart) {
          const result = await tx.productVariant.updateMany({
            where: { sku: line.sku, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (result.count === 0) {
            throw new OutOfStockError();
          }
        }

        const subtotal = variants.reduce(
          (sum, variant, i) =>
            sum +
            (Number(variant.product.basePrice) + Number(variant.priceDiff)) *
              cart[i].quantity,
          0,
        );
        const shipping =
          subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;

        return tx.order.create({
          data: {
            userId: session.user.id,
            status: "CONFIRMED",
            paymentMethod: "COD",
            subtotal,
            shipping,
            total: subtotal + shipping,
            items: {
              create: variants.map((variant, i) => ({
                productId: variant.productId,
                variantId: variant.id,
                nameSnapshot: `${variant.product.name} ${variant.name}`,
                priceSnapshot:
                  Number(variant.product.basePrice) + Number(variant.priceDiff),
                quantity: cart[i].quantity,
              })),
            },
            address: { create: address },
          },
        });
      },
      { maxWait: 5000, timeout: 10000 },
    );

    revalidateTag("products", "max");
    return { ok: true, orderId: order.id };
  } catch (e) {
    if (e instanceof OutOfStockError) {
      return { ok: false, error: "OUT_OF_STOCK" };
    }
    console.error("placeOrder failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
