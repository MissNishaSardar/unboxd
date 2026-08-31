import { PackageXIcon } from "lucide-react";
import InventoryStockEditor from "@/components/Admin/InventoryStockEditor";
import { Badge } from "@/components/shadcnui/badge";
import { Card, CardContent } from "@/components/shadcnui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/guard";
import {
  LOW_STOCK_THRESHOLD,
  getInventoryLowStock,
} from "@/server/admin/queries";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Monitor and manage low-stock inventory on Unboxd.",
};

const AdminInventoryPage = async () => {
  await requireAdminPage();

  const variants = await getInventoryLowStock();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Inventory
        </h1>
        <p className="text-muted-foreground text-sm">
          {variants.length} variant{variants.length === 1 ? "" : "s"} below the
          low-stock threshold of {LOW_STOCK_THRESHOLD}
        </p>
      </div>

      {variants.length === 0 ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageXIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No low-stock variants</EmptyTitle>
            <EmptyDescription>
              Every variant has at least {LOW_STOCK_THRESHOLD} units in stock.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      : <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Quick edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">
                      {variant.productName}
                    </TableCell>
                    <TableCell>{variant.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {variant.sku}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {variant.stock}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={variant.isActive ? "default" : "secondary"}>
                        {variant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <InventoryStockEditor
                        variantId={variant.id}
                        stock={variant.stock}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      }
    </div>
  );
};

export default AdminInventoryPage;
