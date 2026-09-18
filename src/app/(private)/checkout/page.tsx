import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CheckoutClient, { type BuyNowLine } from "./CheckoutClient";
import { getStoreSettings } from "@/server/admin/settings";
import { getUserAddresses } from "@/server/user/addresses";
import prisma from "@/lib/dbClient/prisma";
import { effectivePrice, mrp } from "@/lib/pricing";
import {
  getPlaceholderPhotoUrl,
  resolveProductImageUrl,
} from "@/lib/placeholder";

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
    buyNowItem = {
      productId: product.id,
      sku: variant.sku,
      slug: product.slug,
      name: product.name,
      variantName: variant.name,
      price: effectivePrice(basePrice, priceDiff, product.discountPercent),
      mrp: mrp(basePrice, priceDiff),
      image:
        product.images[0] ?
          resolveProductImageUrl(product.images[0].url, product.slug, 0)
        : getPlaceholderPhotoUrl(product.slug),
      maxStock: variant.stock,
    };
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
    />
  );
};

export default CheckoutPage;
