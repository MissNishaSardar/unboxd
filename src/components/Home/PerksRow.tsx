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
    title: "Fast Dispatch",
    line: "Tracked delivery across India",
  },
] as const;

const PerksRow = () => {
  return (
    <section
      aria-label="Store perks"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {perks.map((perk) => (
        <div
          key={perk.title}
          className="border-border bg-card flex gap-4 rounded-2xl border p-5">
          <div className="bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            <perk.icon
              aria-hidden="true"
              className="text-primary size-5 shrink-0"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-heading text-sm font-medium tracking-tight">
              {perk.title}
            </span>
            <span className="text-muted-foreground text-xs leading-relaxed">
              {perk.line}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
};

export default PerksRow;
