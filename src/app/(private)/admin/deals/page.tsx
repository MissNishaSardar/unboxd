import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { requireAdminPage } from "@/lib/guard";
import { getFlashSales } from "@/server/deals";
import { getStoreSettings } from "@/server/admin/settings";
import DealsTable from "@/components/Admin/DealsTable";
import { ImportLegacyButton } from "@/components/Admin/SaleRowActions";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent } from "@/components/shadcnui/card";

export const metadata: Metadata = {
  title: "Deals",
  description: "Run store wide sales and banners with day date time windows.",
};

const DealsPage = async () => {
  await requireAdminPage();
  const [salesResult, settings] = await Promise.all([
    getFlashSales(),
    getStoreSettings(),
  ]);
  const sales = salesResult.ok ? salesResult.sales : [];
  const showImport = sales.length === 0 && settings.announcementText !== "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Deals
          </h1>
          <p className="text-muted-foreground text-sm">
            One store wide sale at a time. The greater of this sale and each
            product deal wins.
          </p>
        </div>
        <Button
          render={<Link href={"/admin/deals/new" as Route} />}
          nativeButton={false}>
          New sale
        </Button>
      </div>
      {showImport && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              The old settings banner still exists. Move it here to manage it
              with deals.
            </p>
            <ImportLegacyButton />
          </CardContent>
        </Card>
      )}
      <DealsTable sales={sales} />
    </div>
  );
};

export default DealsPage;
