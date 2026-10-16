import ProductCard, { ProductCardData } from "@/components/Product/ProductCard";
import ProductsEmpty from "@/components/Product/ProductsEmpty";

const ProductGrid = ({
  products,
  query,
}: {
  products: ProductCardData[];
  query?: string;
}) => {
  if (products.length === 0) {
    return <ProductsEmpty query={query} />;
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.slug}
          product={product}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
