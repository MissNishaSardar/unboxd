"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ShoppingCartIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent, CardFooter } from "@/components/shadcnui/card";
import { toast } from "@/components/shadcnui/toast";
import WishlistButton from "@/components/Product/WishlistButton";
import { addToCart } from "@/lib/cart/atoms";
import { formatPrice } from "@/lib/format";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  basePrice: string;
  category: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
  defaultVariant: {
    sku: string;
    name: string;
    priceDiff: string;
    stock: number;
  } | null;
};

const ProductCard = ({ product }: { product: ProductCardData }) => {
  const image = product.images[0];
  const variant = product.defaultVariant;
  const price =
    Number(product.basePrice) + (variant ? Number(variant.priceDiff) : 0);
  const outOfStock = !variant || variant.stock === 0;
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const handleAddToCart = () => {
    if (isPending) return;
    if (!session) {
      toast.add({
        title: "Sign in to add items to your cart",
        type: "error",
      });
      router.push(`/auth/login?callbackUrl=/products/${product.slug}`);
      return;
    }
    if (!variant || !image) return;
    addToCart({
      productId: product.id,
      sku: variant.sku,
      slug: product.slug,
      name: product.name,
      variantName: variant.name,
      price,
      image: image.url,
      maxStock: variant.stock,
    });
    toast.add({
      title: "Added to cart",
      description: `${product.name} · ${variant.name}`,
      type: "success",
    });
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="h-full">
      <Card className="group relative flex h-full flex-col border border-zinc-800 ring-0 transition-colors hover:border-zinc-700">
        <Link
          href={`/products/${product.slug}`}
          className="focus-visible:ring-ring/50 block flex-1 rounded-xl outline-none focus-visible:ring-3">
          {image && (
            <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-zinc-900">
              <Image
                src={image.url}
                alt={image.alt ?? product.name}
                fill
                unoptimized
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          <CardContent className="flex flex-col gap-2">
            <Badge
              variant="secondary"
              className="w-fit">
              {product.category.name}
            </Badge>
            <h3 className="font-heading line-clamp-2 text-base leading-snug font-medium">
              {product.name}
            </h3>
          </CardContent>
        </Link>
        <CardFooter className="justify-between gap-2 pb-5">
          <p className="text-lg font-semibold tabular-nums">
            {formatPrice(price)}
          </p>
          <Button
            size="sm"
            disabled={outOfStock}
            onClick={handleAddToCart}
            data-icon="inline-start">
            <ShoppingCartIcon aria-hidden="true" />
            {outOfStock ? "Out of stock" : "Add"}
          </Button>
        </CardFooter>
        <WishlistButton
          productId={product.id}
          className="absolute top-2 right-2"
        />
      </Card>
    </motion.div>
  );
};

export default ProductCard;
