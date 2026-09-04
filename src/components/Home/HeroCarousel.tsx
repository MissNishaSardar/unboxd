"use client";

import { Button } from "@/components/shadcnui/button";
import {
  ArrowRightIcon,
  AudioLinesIcon,
  BanknoteIcon,
  CableIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Gamepad2Icon,
  HeadphonesIcon,
  LaptopIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SparklesIcon,
  TruckIcon,
} from "lucide-react";
import { getPlaceholderPhotoUrl } from "@/lib/placeholder";
import type { ProductCardData } from "@/components/Product/ProductCard";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Slide = {
  eyebrow: string;
  heading: string;
  subtext: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  discIcon: typeof SmartphoneIcon;
  chips: { icon: typeof BanknoteIcon; label: string }[];
};

const slides: Slide[] = [
  {
    eyebrow: "New season, unboxed",
    heading: "Electronics, unboxed.",
    subtext:
      "Latest smartphones, laptops, audio gear and accessories. Cash on delivery and tracked delivery across India.",
    primary: { label: "Shop now", href: "/products" },
    secondary: { label: "Browse categories", href: "/products" },
    discIcon: SmartphoneIcon,
    chips: [
      { icon: BanknoteIcon, label: "COD available" },
      { icon: TruckIcon, label: "Same-week delivery" },
    ],
  },
  {
    eyebrow: "Audio Week",
    heading: "Big sound. Bigger savings.",
    subtext:
      "Up to 25% off headphones, earbuds and speakers. Limited time during Audio Week.",
    primary: { label: "Shop Audio", href: "/products?category=headphones" },
    secondary: { label: "View deals", href: "/products?category=audio" },
    discIcon: HeadphonesIcon,
    chips: [
      { icon: AudioLinesIcon, label: "Up to 25% off" },
      { icon: TruckIcon, label: "Free delivery" },
    ],
  },
  {
    eyebrow: "Gaming ready",
    heading: "RTX rigs, ready to ship.",
    subtext:
      "Gaming laptops with RTX graphics. 24h dispatch and genuine 1-year warranty.",
    primary: {
      label: "Shop Gaming",
      href: "/products?category=gaming-laptops",
    },
    secondary: { label: "Browse all", href: "/products" },
    discIcon: Gamepad2Icon,
    chips: [
      { icon: TruckIcon, label: "24h dispatch" },
      { icon: BanknoteIcon, label: "COD available" },
    ],
  },
  {
    eyebrow: "Work ready",
    heading: "Thin. Light. Powerful.",
    subtext:
      "Ultrabooks from MacBook Air to ThinkPad X1. Fanless M3 power with all day battery.",
    primary: { label: "Shop Laptops", href: "/products?category=laptops" },
    secondary: { label: "View deals", href: "/products?category=laptops" },
    discIcon: LaptopIcon,
    chips: [
      { icon: TruckIcon, label: "Same-day dispatch" },
      { icon: ShieldCheckIcon, label: "1 Year warranty" },
    ],
  },
  {
    eyebrow: "Stay charged",
    heading: "Power for every port.",
    subtext:
      "65W GaN chargers, braided cables and tough cases. Built to protect and fast to charge.",
    primary: {
      label: "Shop Accessories",
      href: "/products?category=chargers-cables",
    },
    secondary: {
      label: "Browse cases",
      href: "/products?category=cases-protection",
    },
    discIcon: CableIcon,
    chips: [
      { icon: BanknoteIcon, label: "COD available" },
      { icon: TruckIcon, label: "Tracked delivery" },
    ],
  },
];

const HeroCarousel = ({ products }: { products?: ProductCardData[] }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (paused) return;
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
  }, [paused, clearTimer]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const goTo = (next: number) => {
    setIndex((next + slides.length) % slides.length);
    startTimer();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    }
  };

  const getProductForSlide = (idx: number): ProductCardData | null => {
    if (!products || products.length === 0) return null;
    if (idx === 0) return products[0] ?? null;
    if (idx === 1) {
      const audio = products.find((p) =>
        ["headphones", "earbuds", "speakers"].includes(p.category.slug),
      );
      return audio ?? products[1] ?? products[0] ?? null;
    }
    if (idx === 2) {
      const gaming = products.find((p) => p.category.slug === "gaming-laptops");
      return gaming ?? products[2] ?? products[0] ?? null;
    }
    if (idx === 3) {
      const laptop = products.find((p) => p.category.slug === "laptops");
      return laptop ?? products[3] ?? products[0] ?? null;
    }
    if (idx === 4) {
      const acc = products.find((p) =>
        ["chargers-cables", "cases-protection"].includes(p.category.slug),
      );
      return acc ?? products[4] ?? products[0] ?? null;
    }
    return products[idx] ?? null;
  };

  return (
    <section
      aria-label="Featured promotions"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
      className="bg-card relative overflow-hidden">
      <div
        className="bg-primary/20 pointer-events-none absolute -top-32 right-0 hidden size-96 rounded-full blur-3xl md:block"
        aria-hidden="true"
      />
      <div className="overflow-hidden">
        <div
          id="hero-carousel-track"
          role="group"
          aria-label="Hero slides"
          className="flex w-full transition-transform duration-600 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((slide, slideIdx) => {
            const DiscIcon = slide.discIcon;
            const product = getProductForSlide(slideIdx);
            const imageUrl =
              product ?
                (product.images[0]?.url ?? getPlaceholderPhotoUrl(product.slug))
              : null;
            const imageAlt =
              product ?
                (product.images[0]?.alt ?? product.name)
              : slide.heading;
            return (
              <div
                key={slide.heading}
                className="flex min-w-full flex-none justify-center px-6 py-10 md:px-10 md:py-14">
                <div className="flex w-full max-w-7xl flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-8">
                  <div className="flex flex-col items-start gap-4">
                    <span className="border-border bg-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
                      <SparklesIcon
                        aria-hidden="true"
                        className="text-primary size-3.5"
                      />
                      {slide.eyebrow}
                    </span>
                    <h2 className="font-heading text-[clamp(28px,4vw,44px)] leading-none font-semibold tracking-tighter">
                      {slide.heading}
                    </h2>
                    <p className="text-muted-foreground max-w-xl text-base md:text-lg">
                      {slide.subtext}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-1">
                      <Button
                        size="lg"
                        render={<Link href={slide.primary.href as never} />}
                        nativeButton={false}
                        data-icon="inline-end">
                        {slide.primary.label}
                        <ArrowRightIcon aria-hidden="true" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        render={<Link href={slide.secondary.href as never} />}
                        nativeButton={false}>
                        {slide.secondary.label}
                      </Button>
                    </div>
                  </div>
                  <div className="relative flex h-[340px] w-full shrink-0 items-center justify-center overflow-hidden md:h-[420px] lg:h-[440px]">
                    <div className="relative flex size-[260px] items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_30%_30%,oklch(0.65_0.18_277/0.9),oklch(0.35_0.15_277/0.6)_70%,oklch(0.2_0.05_285/1)_100%)] shadow-lg md:size-[300px] lg:size-[340px]">
                      {imageUrl ?
                        <Image
                          src={imageUrl}
                          alt={imageAlt}
                          fill
                          unoptimized
                          priority={slideIdx === 0}
                          sizes="(max-width:768px) 260px, 340px"
                          className="object-cover"
                        />
                      : <DiscIcon
                          aria-hidden="true"
                          className="size-20 text-white drop-shadow md:size-24"
                        />
                      }
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute top-12 left-12 size-20 rounded-full bg-white/20 blur-xl"
                      />
                      <div
                        className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10"
                        aria-hidden="true"
                      />
                    </div>
                    {(() => {
                      const Chip0 = slide.chips[0]?.icon;
                      const Chip1 = slide.chips[1]?.icon;
                      return (
                        <>
                          {Chip0 && (
                            <div className="absolute top-6 right-6 hidden items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md md:flex lg:right-10">
                              <Chip0
                                aria-hidden="true"
                                className="size-3.5"
                              />
                              {slide.chips[0].label}
                            </div>
                          )}
                          {Chip1 && (
                            <div className="absolute bottom-8 left-2 hidden items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md md:flex lg:left-6">
                              <Chip1
                                aria-hidden="true"
                                className="size-3.5"
                              />
                              {slide.chips[1].label}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        aria-label="Previous slide"
        aria-controls="hero-carousel-track"
        onClick={() => goTo(index - 1)}
        className="absolute top-1/2 left-4 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none">
        <ChevronLeftIcon
          aria-hidden="true"
          className="size-5"
        />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        aria-controls="hero-carousel-track"
        onClick={() => goTo(index + 1)}
        className="absolute top-1/2 right-4 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none">
        <ChevronRightIcon
          aria-hidden="true"
          className="size-5"
        />
      </button>
      <div
        role="tablist"
        aria-label="Carousel pagination"
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === index ? "bg-foreground w-6" : "bg-muted-foreground/30 w-2"}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
