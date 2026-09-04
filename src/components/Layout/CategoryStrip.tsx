"use client";

import { Button } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  AudioLinesIcon,
  CableIcon,
  ChevronDownIcon,
  Gamepad2Icon,
  Grid2x2Icon,
  HeadphonesIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SpeakerIcon,
  TagIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type CategoryStripItem = {
  slug: string;
  name: string;
  count: number;
};

const categoryIcons: Record<string, LucideIcon> = {
  smartphones: SmartphoneIcon,
  "gaming-laptops": Gamepad2Icon,
  headphones: HeadphonesIcon,
  earbuds: AudioLinesIcon,
  speakers: SpeakerIcon,
  "chargers-cables": CableIcon,
  "cases-protection": ShieldCheckIcon,
};

const CategoryStrip = ({ categories }: { categories: CategoryStripItem[] }) => {
  const [megaOpen, setMegaOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const displayCategories = categories.slice(0, 8);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMegaOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!megaOpen) return;
      if (stripRef.current && !stripRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMegaOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [megaOpen]);

  if (categories.length === 0) return null;

  return (
    <nav
      ref={stripRef}
      aria-label="Categories"
      className="sticky top-[60px] z-30 border-b border-white/10 bg-[rgba(5,5,9,0.85)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 pt-2.5 pb-1 sm:px-6">
        <Button
          variant="secondary"
          size="sm"
          aria-expanded={megaOpen}
          aria-controls="mega-menu"
          aria-haspopup="true"
          onClick={() => setMegaOpen((v) => !v)}
          className="shrink-0 rounded-full bg-white px-3 py-1.5 font-medium text-black hover:bg-white/90 sm:px-4">
          <Grid2x2Icon
            aria-hidden="true"
            className="size-4"
          />
          <span className="hidden sm:inline">All Categories</span>
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              "hidden size-4 transition-transform sm:block",
              megaOpen && "rotate-180",
            )}
          />
        </Button>

        <div className="flex flex-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.45)_rgba(255,255,255,0.08)] items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/45 hover:[&::-webkit-scrollbar-thumb]:bg-white/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/10">
          {displayCategories.map((category) => {
            const Icon = categoryIcons[category.slug] ?? TagIcon;
            return (
              <Link
                key={category.slug}
                href={{
                  pathname: "/products",
                  query: { category: category.slug },
                }}
                className="inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-white/90 transition-colors hover:bg-white/10 hover:text-white">
                <Icon
                  aria-hidden="true"
                  className="size-4 shrink-0"
                />
                {category.name}
              </Link>
            );
          })}
        </div>
      </div>

      {megaOpen && displayCategories.length > 0 && (
        <div
          id="mega-menu"
          role="dialog"
          aria-label="All categories"
          className="absolute top-full right-0 left-0 z-50 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-6 rounded-2xl border border-white/10 bg-[rgba(15,15,20,0.98)] p-6 shadow-xl backdrop-blur-xl">
            <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
              {displayCategories.map((category) => {
                const Icon = categoryIcons[category.slug] ?? TagIcon;
                return (
                  <Link
                    key={category.slug}
                    href={{
                      pathname: "/products",
                      query: { category: category.slug },
                    }}
                    onClick={() => setMegaOpen(false)}
                    className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/5">
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10 text-white">
                      <Icon
                        aria-hidden="true"
                        className="size-5"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-white">
                        {category.name}
                      </span>
                      <span className="text-xs text-white/60 tabular-nums">
                        {category.count} items
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="relative hidden w-[280px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 lg:flex lg:flex-col lg:justify-between">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-violet-500/30 blur-3xl"
              />
              <div className="relative flex flex-col gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-white/80 uppercase">
                  Limited time
                </span>
                <p className="font-heading text-xl leading-tight font-semibold text-white">
                  Weekend Sale - up to 25% off
                </p>
                <p className="text-sm text-white/70">
                  On headphones, earbuds and speakers
                </p>
              </div>
              <Button
                size="sm"
                render={
                  <Link
                    href="/products?category=headphones"
                    onClick={() => setMegaOpen(false)}
                  />
                }
                nativeButton={false}
                className="relative mt-4 w-fit rounded-full bg-white px-5 text-black hover:bg-white/90">
                Shop now
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default CategoryStrip;
