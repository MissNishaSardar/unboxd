import {
  BanknoteIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "lucide-react";

const perks = [
  {
    icon: BanknoteIcon,
    title: "Cash on Delivery",
    line: "Pay on delivery, no prepaid risk",
  },
  {
    icon: RotateCcwIcon,
    title: "7-Day Easy Returns",
    line: "Hassle free returns within 7 days",
  },
  {
    icon: ShieldCheckIcon,
    title: "1-Year Warranty",
    line: "Genuine products with 1 year cover",
  },
  {
    icon: TruckIcon,
    title: "2-4 Day Delivery",
    line: "Tracked delivery in 2 to 4 days across India",
  },
] as const;

const PerksRow = () => {
  return (
    <section
      aria-label="Store perks"
      className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4 lg:gap-3 [&::-webkit-scrollbar]:hidden">
      {perks.map((perk) => (
        <div
          key={perk.title}
          className="border-border bg-card flex w-[calc(50%-4px)] shrink-0 snap-start items-center gap-3 rounded-2xl border px-3.5 py-2.5 shadow-sm sm:w-auto sm:shrink sm:snap-align-none sm:px-4 sm:py-3">
          <div className="bg-muted flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
            <perk.icon
              aria-hidden="true"
              className="text-primary size-4 shrink-0"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-heading truncate text-sm font-medium tracking-tight">
              {perk.title}
            </span>
            <span className="text-muted-foreground truncate text-xs leading-none">
              {perk.line}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
};

export default PerksRow;
