import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import ProductGallery from "@/components/Product/ProductGallery";
import RecordProductView from "@/components/Dashboard/RecordProductView";
import ProductGrid from "@/components/Product/ProductGrid";
import ProductInfo from "@/components/Product/ProductInfo";
import ProductReviews from "@/components/Product/ProductReviews";
import { resolveProductImageUrl } from "@/lib/placeholder";
import {
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from "@/server/catalog";
import { getReviewsBySlug } from "@/server/reviews";

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

  const [related, initialReviews] = await Promise.all([
    getRelatedProducts(product.slug, product.category.slug),
    getReviewsBySlug(product.slug),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <RecordProductView productId={product.id} />
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

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <ProductGallery
          images={product.images}
          name={product.name}
          slug={product.slug}
        />
        <ProductInfo
          productId={product.id}
          slug={product.slug}
          name={product.name}
          brand={product.brand}
          brandSlug={product.brandSlug}
          basePrice={product.basePrice}
          discountPercent={product.discountPercent}
          priceFrom={product.priceFrom}
          mrpFrom={product.mrpFrom}
          image={resolveProductImageUrl(
            product.images[0]?.url ?? "",
            product.slug,
            0,
          )}
          variants={product.variants}
          description={product.description}
          initialReviews={initialReviews}
        />
      </div>

      <div id="reviews-full">
        <ProductReviews
          key={product.slug}
          slug={product.slug}
          productId={product.id}
          initialReviews={initialReviews}
        />
      </div>

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
