import { getStoreSettings } from "@/server/admin/settings";

const AnnouncementBanner = async () => {
  const settings = await getStoreSettings();
  if (!settings.announcementEnabled || !settings.announcementText) return null;

  return (
    <p
      role="status"
      className="bg-primary text-primary-foreground px-4 py-2 text-center text-xs font-medium">
      {settings.announcementText}
    </p>
  );
};

export default AnnouncementBanner;
