import type { Metadata } from "next";
import StoreSettingsForm from "@/components/Admin/StoreSettingsForm";
import { requireAdminPage } from "@/lib/guard";
import { getStoreSettings } from "@/server/admin/settings";

export const metadata: Metadata = {
  title: "Store Settings",
  description: "Manage store name, ordering, inventory, and announcements.",
};

const AdminSettingsPage = async () => {
  await requireAdminPage();
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Store settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Changes apply across the storefront immediately.
        </p>
      </div>
      <StoreSettingsForm
        initialData={{
          ...settings,
          freeShippingThreshold: Number(settings.freeShippingThreshold),
          shippingFlatRate: Number(settings.shippingFlatRate),
        }}
      />
    </div>
  );
};

export default AdminSettingsPage;
