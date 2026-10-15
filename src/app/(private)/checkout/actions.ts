"use server";

import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import type { Product, ProductVariant } from "@generated/prisma/client";
import { checkoutSchema } from "@/lib/zodSchema";
import {
  activeDiscountPercent,
  combineDiscountPercent,
  effectivePrice,
  mrp,
} from "@/lib/pricing";
import { getActiveSalePercent } from "@/server/deals";
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
        const salePercent = await getActiveSalePercent();
        const skus = cart.map((line) => line.sku);
        const found = await tx.productVariant.findMany({
          where: { sku: { in: skus } },
          include: { product: true },
        });
        const bySku = new Map(found.map((variant) => [variant.sku, variant]));
        const variants: (ProductVariant & { product: Product })[] = [];
        for (const line of cart) {
          const variant = bySku.get(line.sku);
          if (!variant || !variant.product.isActive) {
            throw new OutOfStockError();
          }
          variants.push(variant);
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
            combineDiscountPercent(
              activeDiscountPercent(
                {
                  discountPercent: variant.product.discountPercent ?? 0,
                  discountStartsAt: variant.product.discountStartsAt,
                  discountEndsAt: variant.product.discountEndsAt,
                },
                Date.now(),
              ),
              salePercent,
            ),
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
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2025"
    ) {
      return { ok: false, error: "OUT_OF_STOCK" };
    }
    console.error("placeOrder failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export type CartQuoteLine = {
  sku: string;
  price: number;
  mrp: number;
  maxStock: number;
  available: boolean;
};

export type CartQuoteResult =
  | {
      ok: true;
      lines: CartQuoteLine[];
      freeShippingThreshold: number;
      shippingFlatRate: number;
    }
  | { ok: false; error: "INVALID_INPUT" | "SERVER_ERROR" };

export async function quoteCart(input: unknown): Promise<CartQuoteResult> {
  const parsed = z.array(cartLineSchema).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  try {
    const salePercent = await getActiveSalePercent();
    const settings = await getStoreSettings();
    const freeShippingThreshold = Number(settings.freeShippingThreshold);
    const shippingFlatRate = Number(settings.shippingFlatRate);
    const skus = parsed.data.map((line) => line.sku);
    const found = await prisma.productVariant.findMany({
      where: { sku: { in: skus } },
      include: { product: true },
    });
    const bySku = new Map(found.map((variant) => [variant.sku, variant]));
    const lines = parsed.data.map((line) => {
      const variant = bySku.get(line.sku);
      if (!variant || !variant.product.isActive) {
        return {
          sku: line.sku,
          price: 0,
          mrp: 0,
          maxStock: 0,
          available: false,
        };
      }
      const base = Number(variant.product.basePrice);
      const diff = Number(variant.priceDiff);
      return {
        sku: line.sku,
        price: effectivePrice(
          base,
          diff,
          combineDiscountPercent(
            activeDiscountPercent(
              {
                discountPercent: variant.product.discountPercent ?? 0,
                discountStartsAt: variant.product.discountStartsAt,
                discountEndsAt: variant.product.discountEndsAt,
              },
              Date.now(),
            ),
            salePercent,
          ),
        ),
        mrp: mrp(base, diff),
        maxStock: variant.stock,
        available: variant.stock > 0,
      };
    });
    return { ok: true, lines, freeShippingThreshold, shippingFlatRate };
  } catch (e) {
    console.error("quoteCart failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
