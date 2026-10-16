import Link from "next/link";
import type { Route } from "next";
import { ArrowRightIcon, BadgePercentIcon, MegaphoneIcon } from "lucide-react";
import BannerCountdown from "@/components/Layout/BannerCountdown";
import prisma from "@/lib/dbClient/prisma";
import { getActiveBanner } from "@/server/deals";
import { getStoreSettings } from "@/server/admin/settings";

const STRIP_CLASS =
  "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]";
const INNER_CLASS =
  "mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-2 text-xs font-medium";

const ShopSaleLink = () => (
  <Link
    href={"/products" as Route}
    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
    Shop sale
    <ArrowRightIcon
      aria-hidden="true"
      className="size-3"
    />
  </Link>
);

const AnnouncementBanner = async () => {
  const [banner, settings, saleCount] = await Promise.all([
    getActiveBanner(),
    getStoreSettings(),
    prisma.flashSale.count(),
  ]);
  if (banner) {
    const OfferIcon =
      banner.discountPercent > 0 ? BadgePercentIcon : MegaphoneIcon;
    return (
      <div
        role="status"
        className={STRIP_CLASS}>
        <div className={INNER_CLASS}>
          <span className="flex max-w-full min-w-0 items-center gap-1.5">
            <OfferIcon
              aria-hidden="true"
              className="size-4 shrink-0"
            />
            <span className="truncate font-semibold">{banner.text}</span>
          </span>
          {banner.discountPercent > 0 && (
            <span className="border-primary-foreground/50 shrink-0 rounded-full border px-2 py-0.5 font-semibold tabular-nums">
              {banner.discountPercent}% off
            </span>
          )}
          {banner.endsAt && <BannerCountdown endsAt={banner.endsAt} />}
          <ShopSaleLink />
        </div>
      </div>
    );
  }
  if (!settings.announcementEnabled || !settings.announcementText) return null;
  if (saleCount > 0) return null;

  return (
    <div
      role="status"
      className={STRIP_CLASS}>
      <div className={INNER_CLASS}>
        <span className="flex max-w-full min-w-0 items-center gap-1.5">
          <MegaphoneIcon
            aria-hidden="true"
            className="size-4 shrink-0"
          />
          <span className="truncate font-semibold">
            {settings.announcementText}
          </span>
        </span>
        <ShopSaleLink />
      </div>
    </div>
  );
};

export default AnnouncementBanner;
