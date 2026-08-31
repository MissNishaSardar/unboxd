"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/settings", label: "Settings" },
] as const;

const PrivateNav = () => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_LINKS.map((link) => {
        const isActive =
          link.href === "/dashboard" ?
            pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive ?
                "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default PrivateNav;
