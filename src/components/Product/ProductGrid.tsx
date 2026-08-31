import ProductCard, { ProductCardData } from "@/components/Product/ProductCard";
import ProductsEmpty from "@/components/Product/ProductsEmpty";

const ProductGrid = ({ products }: { products: ProductCardData[] }) => {
  if (products.length === 0) {
    return <ProductsEmpty />;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
