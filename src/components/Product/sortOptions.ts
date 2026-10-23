import { ArrowDownIcon, ArrowUpIcon, ClockIcon, StarIcon } from "lucide-react";

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Newest First",
    description: "Recently added",
    icon: ClockIcon,
  },
  {
    value: "price_asc",
    label: "Price: Low to High",
    description: "Cheapest first",
    icon: ArrowUpIcon,
  },
  {
    value: "price_desc",
    label: "Price: High to Low",
    description: "Most expensive first",
    icon: ArrowDownIcon,
  },
  {
    value: "rating_desc",
    label: "Highest Rated",
    description: "Best reviews first (5★ → 1★)",
    icon: StarIcon,
  },
  {
    value: "rating_asc",
    label: "Lowest Rated",
    description: "Lowest reviews first (1★ → 5★)",
    icon: StarIcon,
  },
] as const;

export { SORT_OPTIONS };
