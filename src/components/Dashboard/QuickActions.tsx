import Link from "next/link";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

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

const QuickActions = ({ isAdmin }: { isAdmin: boolean }) => {
  const sections =
    isAdmin ?
      [
        ...SECTIONS,
        {
          title: "Admin dashboard",
          description: "Manage the store",
          href: "/admin" as const,
        },
      ]
    : SECTIONS;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
            <CardAction>
              <Button
                render={<Link href={section.href} />}
                nativeButton={false}
                variant="outline"
                size="sm">
                Open
              </Button>
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

export default QuickActions;
