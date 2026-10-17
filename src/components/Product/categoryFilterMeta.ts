import type { LucideIcon } from "lucide-react";
import {
  AudioLinesIcon,
  CableIcon,
  Gamepad2Icon,
  HeadphonesIcon,
  LaptopIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SpeakerIcon,
  TagIcon,
} from "lucide-react";

export const ALL_CATEGORY = "all";

export type FilterCategory = {
  slug: string;
  name: string;
  count: number;
};

export const categoryIcons: Record<string, LucideIcon> = {
  smartphones: SmartphoneIcon,
  "gaming-laptops": Gamepad2Icon,
  laptops: LaptopIcon,
  headphones: HeadphonesIcon,
  earbuds: AudioLinesIcon,
  speakers: SpeakerIcon,
  "chargers-cables": CableIcon,
  "cases-protection": ShieldCheckIcon,
};

export const FallbackIcon = TagIcon;
