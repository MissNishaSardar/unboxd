import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import ProductGallery from "@/components/Product/ProductGallery";
import ProductGrid from "@/components/Product/ProductGrid";
import ProductInfo from "@/components/Product/ProductInfo";
import {
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from "@/server/catalog";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found" };
  }
  return {
    title: product.name,
    description: product.description,
  };
}

const ProductPage = async ({ params }: Props) => {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.slug, product.category.slug);

  return (
    <div className="flex flex-col gap-10 px-6 py-10">
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground flex items-center gap-1 text-sm">
        <Link
          href="/"
          className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRightIcon
          className="size-3.5"
          aria-hidden="true"
        />
        <Link
          href="/products"
          className="hover:text-foreground transition-colors">
          Products
        </Link>
        <ChevronRightIcon
          className="size-3.5"
          aria-hidden="true"
        />
        <Link
          href={{
            pathname: "/products",
            query: { category: product.category.slug },
          }}
          className="hover:text-foreground transition-colors">
          {product.category.name}
        </Link>
        <ChevronRightIcon
          className="size-3.5"
          aria-hidden="true"
        />
        <span className="text-foreground truncate">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          images={product.images}
          name={product.name}
        />
        <ProductInfo
          productId={product.id}
          slug={product.slug}
          name={product.name}
          basePrice={product.basePrice}
          priceFrom={product.priceFrom}
          image={product.images[0]?.url ?? ""}
          variants={product.variants}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-medium">Description</h2>
        <p className="text-muted-foreground max-w-2xl">{product.description}</p>
      </section>

      {related.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-xl font-medium">Related products</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
};

export default ProductPage;
