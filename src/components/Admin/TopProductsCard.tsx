import type { Route } from "next";
import Link from "next/link";
import AdminEmptyState from "@/components/Admin/AdminEmptyState";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getTopProducts } from "@/server/admin/queries";

const TopProductsCard = async ({ className }: { className?: string }) => {
  const products = await getTopProducts(5);

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader>
        <CardTitle>Top products</CardTitle>
        <CardDescription>Best sellers by units sold</CardDescription>
        <CardAction>
          <Button
            render={<Link href={"/admin/products" as Route} />}
            nativeButton={false}
            variant="outline"
            size="sm">
            View catalog
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {products.length === 0 ?
          <AdminEmptyState
            title="No sales to rank yet"
            message="Top sellers will appear here once orders arrive. Feature products on the storefront to get started."
            actionHref={"/admin/products" as Route}
            actionLabel="View catalog"
          />
        : <ol className="divide-border flex flex-col divide-y">
            {products.map((product) => (
              <li
                key={product.productId}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="text-muted-foreground w-5 shrink-0 text-xs font-semibold tabular-nums">
                  {product.rank}
                </span>
                <div className="min-w-0 flex-1">
                  {product.slug ?
                    <Link
                      href={
                        `/admin/products/${product.productId}/edit` as Route
                      }
                      className="block truncate text-sm font-medium underline-offset-4 hover:underline">
                      {product.name}
                    </Link>
                  : <p className="block truncate text-sm font-medium">
                      {product.name}
                    </p>
                  }
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {product.units} sold
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatPrice(product.revenue)}
                </span>
              </li>
            ))}
          </ol>
        }
      </CardContent>
    </Card>
  );
};

export default TopProductsCard;
