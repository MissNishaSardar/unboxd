import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page is missing. Browse products or head back home.",
};

const POPULAR = [
  { name: "Smartphones", slug: "smartphones" },
  { name: "Laptops", slug: "laptops" },
  { name: "Headphones", slug: "headphones" },
  { name: "Earbuds", slug: "earbuds" },
  { name: "Speakers", slug: "speakers" },
  { name: "Chargers and Cables", slug: "chargers-cables" },
] as const;

const SUPPORT = [
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "Shipping", href: "/policies/shipping" },
  { name: "Warranty", href: "/policies/warranty" },
] as const;

const notFound = () => {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="items-center justify-items-center text-center">
          <p className="text-muted-foreground font-heading text-5xl font-semibold tracking-tight">
            404
          </p>
          <CardTitle className="text-lg">Page not found</CardTitle>
          <CardDescription>
            This link is broken or the page moved. Pick a lane below.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button
              render={<Link href="/products" />}
              nativeButton={false}>
              Browse products
            </Button>
            <Button
              variant="outline"
              render={<Link href="/" />}
              nativeButton={false}>
              Back home
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-center text-xs font-medium tracking-wide uppercase">
              Popular right now
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR.map((item) => (
                <Button
                  key={item.slug}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  render={<Link href={`/categories/${item.slug}`} />}
                  nativeButton={false}>
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
            {SUPPORT.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-primary underline underline-offset-4">
                {item.name}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default notFound;
