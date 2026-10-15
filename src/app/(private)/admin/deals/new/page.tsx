import type { Metadata } from "next";
import DealForm from "@/components/Admin/DealForm";
import { requireAdminPage } from "@/lib/guard";
import { getStoreSettings } from "@/server/admin/settings";

export const metadata: Metadata = {
  title: "New Sale",
  description: "Create a store wide sale with a day date time window.",
};

const NewSalePage = async () => {
  await requireAdminPage();
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          New sale
        </h1>
        <p className="text-muted-foreground text-sm">
          One sale covers the whole store. Overlaps with another discount sale
          are blocked.
        </p>
      </div>
      <DealForm
        mode="create"
        maxDiscountPercent={settings.maxDiscountPercent}
      />
    </div>
  );
};

export default NewSalePage;
