import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DealForm from "@/components/Admin/DealForm";
import { requireAdminPage } from "@/lib/guard";
import { getStoreSettings } from "@/server/admin/settings";
import prisma from "@/lib/dbClient/prisma";

export const metadata: Metadata = {
  title: "Edit Sale",
  description: "Edit a store wide sale.",
};

const EditSalePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  await requireAdminPage();
  const { id } = await params;
  const [row, settings] = await Promise.all([
    prisma.flashSale.findUnique({ where: { id } }),
    getStoreSettings(),
  ]);
  if (!row) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Edit sale
        </h1>
        <p className="text-muted-foreground text-sm">{row.name}</p>
      </div>
      <DealForm
        mode="edit"
        saleId={id}
        initialData={{
          id: row.id,
          name: row.name,
          discountPercent: row.discountPercent,
          startsAt: row.startsAt ? row.startsAt.toISOString() : null,
          endsAt: row.endsAt ? row.endsAt.toISOString() : null,
          bannerText: row.bannerText,
          bannerEnabled: row.bannerEnabled,
          isActive: row.isActive,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }}
        maxDiscountPercent={settings.maxDiscountPercent}
      />
    </div>
  );
};

export default EditSalePage;
