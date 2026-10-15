import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CheckoutClient, { type BuyNowLine } from "./CheckoutClient";
import { getStoreSettings } from "@/server/admin/settings";
import { getUserAddresses } from "@/server/user/addresses";
import { getBuyAgainItems } from "@/server/order-actions";
import prisma from "@/lib/dbClient/prisma";
import {
  activeDiscountPercent,
  combineDiscountPercent,
  effectivePrice,
  mrp,
} from "@/lib/pricing";
import {
  getPlaceholderPhotoUrl,
  resolveProductImageUrl,
} from "@/lib/placeholder";
import type { CartItem } from "@/lib/cart/atoms";
import { getActiveSalePercent } from "@/server/deals";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Unboxd order with cash on delivery.",
};

const CheckoutPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const settings = await getStoreSettings();
  let initialAddresses: Awaited<ReturnType<typeof getUserAddresses>> = [];
  try {
    initialAddresses = await getUserAddresses();
  } catch {
    initialAddresses = [];
  }
  const now = new Date();
  const deliveryDate = new Date(
    now.getTime() + settings.deliveryDays * 86400000,
  ).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  let buyNowItem: BuyNowLine | null = null;
  const params = await searchParams;
  const rawBuyNow = params.buyNow;
  const buyNowSku = Array.isArray(rawBuyNow) ? rawBuyNow[0] : rawBuyNow;
  const rawReorder = params.reorder;
  const reorderId = Array.isArray(rawReorder) ? rawReorder[0] : rawReorder;
  let reorderOrderId: string | null = null;
  let reorderItems: CartItem[] | null = null;
  let reorderSkipped: { name: string; reason: string }[] = [];
  let reorderError: string | null = null;
  if (buyNowSku) {
    const variant = await prisma.productVariant.findUnique({
      where: { sku: buyNowSku },
      include: {
        product: {
          include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        },
      },
    });
    const product = variant?.product;
    if (!variant || !product) redirect("/products");
    if (!product.isActive || variant.stock <= 0) {
      redirect(`/products/${product.slug}`);
    }
    const basePrice = Number(product.basePrice);
    const priceDiff = Number(variant.priceDiff);
    const salePercent = await getActiveSalePercent();
    buyNowItem = {
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
            now.getTime(),
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
    };
  }

  if (!buyNowSku && reorderId) {
    reorderOrderId = reorderId;
    const result = await getBuyAgainItems(reorderId);
    if (!result.ok) {
      if (result.error === "UNAUTHENTICATED") {
        redirect(
          `/auth/login?callbackUrl=/checkout?reorder=${encodeURIComponent(reorderId)}`,
        );
      }
      reorderItems = [];
      reorderError = result.error;
    } else {
      reorderItems = result.items.map((item) => ({
        productId: item.productId,
        sku: item.sku,
        slug: item.slug,
        name: item.name,
        variantName: item.variantName,
        price: item.price,
        mrp: item.mrp,
        image: item.image,
        quantity: item.quantity,
        maxStock: item.maxStock,
      }));
      reorderSkipped = result.skipped;
    }
  }

  return (
    <CheckoutClient
      freeShippingThreshold={Number(settings.freeShippingThreshold)}
      shippingFlatRate={Number(settings.shippingFlatRate)}
      codEnabled={settings.codEnabled}
      returnWindowDays={settings.returnWindowDays}
      deliveryDate={deliveryDate}
      initialAddresses={initialAddresses}
      buyNowItem={buyNowItem}
      reorderOrderId={reorderOrderId}
      reorderItems={reorderItems}
      reorderSkipped={reorderSkipped}
      reorderError={reorderError}
    />
  );
};

export default CheckoutPage;
