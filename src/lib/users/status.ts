import type { LucideIcon } from "lucide-react";
import { BanIcon, CheckCircle2Icon, ClockIcon } from "lucide-react";

export type UserStatus = "active" | "suspended" | "banned" | "deactivated";

type UserStatusConfig = {
  label: string;
  badgeVariant: "default" | "secondary" | "destructive";
  badgeClass?: string;
  icon: LucideIcon;
};

export const userStatusConfig: Record<UserStatus, UserStatusConfig> = {
  active: {
    label: "Active",
    badgeVariant: "secondary",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2Icon,
  },
  suspended: {
    label: "Suspended",
    badgeVariant: "secondary",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    icon: ClockIcon,
  },
  banned: {
    label: "Banned",
    badgeVariant: "destructive",
    icon: BanIcon,
  },
  deactivated: {
    label: "Deactivated",
    badgeVariant: "secondary",
    badgeClass: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
    icon: BanIcon,
  },
};

export function getUserStatus(params: {
  banned?: boolean | null;
  banExpires?: string | null;
  deletedAt?: string | null;
}): UserStatus {
  if (params.deletedAt) return "deactivated";
  if (params.banned) {
    if (params.banExpires) {
      const exp = new Date(params.banExpires);
      if (!isNaN(exp.getTime()) && exp.getTime() > Date.now())
        return "suspended";
    }
    return "banned";
  }
  return "active";
}

export function getUserStatusConfig(params: {
  banned?: boolean | null;
  banExpires?: string | null;
  deletedAt?: string | null;
}): UserStatusConfig {
  return userStatusConfig[getUserStatus(params)];
}
