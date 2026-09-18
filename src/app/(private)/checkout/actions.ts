"use server";

import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import type { Product, ProductVariant } from "@generated/prisma/client";
import { checkoutSchema } from "@/lib/zodSchema";
import { effectivePrice } from "@/lib/pricing";
import { getStoreSettings } from "@/server/admin/settings";

const cartLineSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

const placeOrderInputSchema = z
  .object({
    address: checkoutSchema.optional(),
    addressId: z.string().min(1).optional(),
    cart: z.array(cartLineSchema).min(1, "Cart is empty"),
  })
  .refine((value) => value.address ?? value.addressId, {
    error: "Address is required",
  });

class OutOfStockError extends Error {}

export type PlaceOrderResult =
  | { ok: true; orderId: string; orderNumber: number; total: number }
  | {
      ok: false;
      error:
        | "UNAUTHENTICATED"
        | "OUT_OF_STOCK"
        | "INVALID_INPUT"
        | "ORDERING_PAUSED"
        | "SERVER_ERROR";
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

  const { address: rawAddress, addressId, cart } = parsed.data;

  // Resolve the shipping address, either from the book (ownership checked)
  // or from raw form fields.
  let address: {
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  if (rawAddress) {
    address = rawAddress;
  } else if (addressId) {
    const saved = await prisma.userAddress.findUnique({
      where: { id: addressId },
    });
    if (!saved || saved.userId !== session.user.id) {
      return { ok: false, error: "INVALID_INPUT" };
    }
    address = {
      name: saved.name,
      phone: saved.phone,
      addressLine: saved.addressLine,
      city: saved.city,
      state: saved.state,
      pincode: saved.pincode,
    };
  } else {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const settings = await getStoreSettings();
  if (!settings.codEnabled) {
    return { ok: false, error: "ORDERING_PAUSED" };
  }
  const freeShippingThreshold = Number(settings.freeShippingThreshold);
  const shippingFlatRate = Number(settings.shippingFlatRate);

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

        const linePrice = (variant: ProductVariant & { product: Product }) =>
          effectivePrice(
            Number(variant.product.basePrice),
            Number(variant.priceDiff),
            variant.product.discountPercent ?? 0,
          );

        const subtotal = variants.reduce(
          (sum, variant, i) => sum + linePrice(variant) * cart[i].quantity,
          0,
        );
        const shipping =
          subtotal >= freeShippingThreshold ? 0 : shippingFlatRate;

        // Atomically claim the next friendly order number. SQLite
        // serializes the write transaction, so concurrent checkouts
        // cannot claim the same number.
        const counter = await tx.orderCounter.update({
          where: { id: "orders" },
          data: { nextValue: { increment: 1 } },
        });

        return tx.order.create({
          data: {
            userId: session.user.id,
            orderNumber: counter.nextValue - 1,
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
                priceSnapshot: linePrice(variant),
                quantity: cart[i].quantity,
              })),
            },
            address: { create: address },
          },
        });
      },
      { maxWait: 5000, timeout: 10000 },
    );

    // Auto-save the used address into the book, skipping exact duplicates.
    // Best effort, never fails the order.
    try {
      const duplicate = await prisma.userAddress.findFirst({
        where: {
          userId: session.user.id,
          name: address.name,
          phone: address.phone,
          addressLine: address.addressLine,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        select: { id: true },
      });
      if (!duplicate) {
        const bookCount = await prisma.userAddress.count({
          where: { userId: session.user.id },
        });
        await prisma.userAddress.create({
          data: {
            userId: session.user.id,
            ...address,
            isDefault: bookCount === 0,
          },
        });
      }
    } catch (e) {
      console.error("placeOrder address auto-save failed", e);
    }

    revalidateTag("products", "max");
    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
    };
  } catch (e) {
    if (e instanceof OutOfStockError) {
      return { ok: false, error: "OUT_OF_STOCK" };
    }
    console.error("placeOrder failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
