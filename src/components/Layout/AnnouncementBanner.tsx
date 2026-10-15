import BannerCountdown from "@/components/Layout/BannerCountdown";
import prisma from "@/lib/dbClient/prisma";
import { getActiveBanner } from "@/server/deals";
import { getStoreSettings } from "@/server/admin/settings";

const AnnouncementBanner = async () => {
  const [banner, settings, saleCount] = await Promise.all([
    getActiveBanner(),
    getStoreSettings(),
    prisma.flashSale.count(),
  ]);
  if (banner) {
    return (
      <p
        role="status"
        className="bg-primary text-primary-foreground px-4 py-2 text-center text-xs font-medium">
        {banner.text}
        {banner.endsAt && <BannerCountdown endsAt={banner.endsAt} />}
      </p>
    );
  }
  if (!settings.announcementEnabled || !settings.announcementText) return null;
  if (saleCount > 0) return null;

  return (
    <p
      role="status"
      className="bg-primary text-primary-foreground px-4 py-2 text-center text-xs font-medium">
      {settings.announcementText}
    </p>
  );
};

export default AnnouncementBanner;
