"use client";

/* eslint-disable react-hooks/set-state-in-effect -- syncing URL query state to list after filter change is intentional */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { PencilIcon } from "lucide-react";
import ProductActions from "@/components/Admin/ProductActions";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent } from "@/components/shadcnui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import { formatPrice } from "@/lib/format";

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  basePrice: string;
  isActive: boolean;
  featured?: boolean;
  categoryName: string;
  imageUrl: string;
  totalStock: number;
  variantCount: number;
};

const AdminProductsLoadMore = ({
  initialProducts,
  total,
}: {
  initialProducts: AdminProduct[];
  total: number;
}) => {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProducts(initialProducts);
    setPage(1);
  }, [initialProducts]);

  const canLoadMore = products.length < total;

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(nextPage));
      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = (await res.json()) as { products: AdminProduct[] };
      setProducts((prev) => [...prev, ...data.products]);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0 sm:p-6">
          <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:overflow-visible sm:px-0">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={40}
                          height={40}
                          unoptimized
                          className="size-10 shrink-0 rounded-md object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {product.name}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.categoryName}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatPrice(Number(product.basePrice))}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {product.totalStock}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {product.variantCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          render={
                            <Link
                              href={
                                `/admin/products/${product.id}/edit` as Route
                              }
                            />
                          }
                          nativeButton={false}
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${product.name}`}>
                          <PencilIcon aria-hidden="true" />
                        </Button>
                        <ProductActions
                          id={product.id}
                          isActive={product.isActive}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {canLoadMore && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-muted-foreground text-xs tabular-nums">
            Showing {products.length} of {total}
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={loading}
            className="w-full rounded-full px-8 sm:w-auto">
            {loading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
};

export default AdminProductsLoadMore;
