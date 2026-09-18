import Link from "next/link";
import { Button } from "@/components/shadcnui/button";
import ProductCard, {
  type ProductCardData,
} from "@/components/Product/ProductCard";

type ProductRailProps = {
  title: string;
  products: ProductCardData[];
  href?: string;
  linkLabel?: string;
  cardClass?: string;
  compact?: boolean;
};

const ProductRail = ({
  title,
  products,
  href,
  linkLabel,
  cardClass = "w-56",
  compact,
}: ProductRailProps) => {
  if (products.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {href && (
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={href as never} />}
            nativeButton={false}>
            {linkLabel ?? "View all"}
          </Button>
        )}
      </div>
      <div className="flex snap-x gap-4 overflow-x-auto pb-2">
        {products.map((product) => (
          <div
            key={product.id}
            className={`${cardClass} shrink-0 snap-start`}>
            <ProductCard
              product={product}
              compact={compact}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductRail;
