"use client";

import Link from "next/link";
import { useAtomValue } from "jotai";
import { Badge } from "@/components/shadcnui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { useMounted } from "@/hooks/use-mounted";
import { cartCountAtom } from "@/lib/cart/atoms";

const SECTIONS = [
  {
    title: "Browse products",
    description: "Explore the catalog",
    href: "/products" as const,
  },
  {
    title: "Cart",
    description: "Review items before checkout",
    href: "/cart" as const,
  },
  {
    title: "Orders",
    description: "Track and view order history",
    href: "/orders" as const,
  },
  {
    title: "Settings",
    description: "Your account and preferences",
    href: "/settings" as const,
  },
];

const QuickActions = ({
  isAdmin,
  hideBrowse,
}: {
  isAdmin: boolean;
  hideBrowse?: boolean;
}) => {
  const cartCount = useAtomValue(cartCountAtom);
  const mounted = useMounted();
  const sections = (
    isAdmin ?
      [
        ...SECTIONS,
        {
          title: "Admin dashboard",
          description: "Manage the store",
          href: "/admin" as const,
        },
      ]
    : SECTIONS).filter(
    (section) => !(hideBrowse && section.href === "/products"),
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map((section) => (
        <Link
          key={section.title}
          href={section.href}
          className="focus-visible:ring-ring/50 block rounded-xl transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:outline-none">
          <Card className="h-full transition-colors hover:border-zinc-700">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle>{section.title}</CardTitle>
                {section.href === "/cart" && mounted && (
                  <Badge variant={cartCount === 0 ? "outline" : "secondary"}>
                    {cartCount} {cartCount === 1 ? "item" : "items"}
                  </Badge>
                )}
              </div>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default QuickActions;
