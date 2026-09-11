"use client";

/* eslint-disable react-hooks/set-state-in-effect -- closing dropdown on route change is intentional sync */
import { Button } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";
import type { BrandWithCount } from "@/server/brands";
import { ChevronDownIcon, Grid2x2Icon, TagIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const BrandDropdown = ({ brands }: { brands: BrandWithCount[] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open) return;
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (brands.length === 0) return null;

  const display = brands.slice(0, 12);

  return (
    <div
      ref={ref}
      className="relative hidden min-[920px]:block">
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-controls="brand-mega-menu"
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground rounded-full border px-3 py-1.5 font-medium">
        <Grid2x2Icon
          aria-hidden="true"
          className="size-4"
        />
        Brands
        <ChevronDownIcon
          aria-hidden="true"
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </Button>
      {open && (
        <div
          id="brand-mega-menu"
          role="dialog"
          aria-label="All brands"
          className="absolute top-full left-0 z-50 mt-2 w-[680px] max-w-[calc(100vw-32px)]">
          <div className="border-border bg-popover flex gap-6 rounded-2xl border p-6 shadow-xl backdrop-blur-xl">
            <div className="grid flex-1 grid-cols-2 gap-2.5 lg:grid-cols-3">
              {display.map((brand) => (
                <Link
                  key={brand.slug}
                  href={{ pathname: "/products", query: { brand: brand.slug } }}
                  onClick={() => setOpen(false)}
                  title={brand.name}
                  className="group hover:bg-accent flex min-w-0 items-center gap-2.5 overflow-hidden rounded-xl p-2.5 transition-colors">
                  <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                    <TagIcon
                      aria-hidden="true"
                      className="size-5"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <span className="text-foreground block w-full truncate text-sm font-medium">
                      {brand.name}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {brand.count} items
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="relative hidden w-[180px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 lg:flex lg:flex-col lg:justify-between">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-violet-500/30 blur-3xl"
              />
              <div className="relative flex flex-col gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-white/80 uppercase">
                  Brands
                </span>
                <p className="font-heading text-xl leading-tight font-semibold text-white">
                  Shop by brand
                </p>
                <p className="text-sm text-white/70">
                  Find your favorite makers in one place
                </p>
              </div>
              <Button
                size="sm"
                render={
                  <Link
                    href="/products"
                    onClick={() => setOpen(false)}
                  />
                }
                nativeButton={false}
                className="relative mt-4 w-fit rounded-full bg-white px-5 text-black hover:bg-white/90">
                View all
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandDropdown;
