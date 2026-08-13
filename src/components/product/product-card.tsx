import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/shadcnui/badge";
import { Card, CardContent, CardFooter } from "@/components/shadcnui/card";
import { formatPrice } from "@/lib/format";

export type ProductCardData = {
  slug: string;
  name: string;
  basePrice: string;
  category: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
};

const ProductCard = ({ product }: { product: ProductCardData }) => {
  const image = product.images[0];
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-3">
      <Card className="group-hover:ring-foreground/30 h-full transition-colors">
        {image && (
          <div className="relative aspect-square w-full overflow-hidden">
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
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
        <CardFooter className="pb-6">
          <p className="text-lg font-semibold tabular-nums">
            {formatPrice(product.basePrice)}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductCard;
