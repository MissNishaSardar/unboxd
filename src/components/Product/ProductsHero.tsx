"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/components/Product/ProductCard";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";

const AUTOPLAY_MS = 5000;

const promoLabels: Record<string, string> = {
  "0": "Featured • New drop",
  "1": "Limited promo",
  "2": "Editor pick",
  "3": "Trending now",
  "4": "Staff favorite",
};

const ProductsHero = ({ products }: { products: ProductCardData[] }) => {
  const slides = products.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const next = useCallback(
    () => setIndex((i) => (i + 1) % slides.length),
    [slides.length],
  );
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (slides.length <= 1 || paused || prefersReducedMotion) return;
    intervalRef.current = setInterval(next, AUTOPLAY_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, prefersReducedMotion, slides.length, next]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  if (slides.length === 0) return null;

  const active = slides[index];
  if (!active) return null;
  const imageUrl = active.images[0]?.url ?? "/placeholder.svg";
  const price =
    Number(active.basePrice) + Number(active.defaultVariant?.priceDiff ?? "0");
  const mrp = Math.ceil((price * 1.25) / 100) * 100;
  const discount = Math.max(5, Math.round(((mrp - price) / mrp) * 100));

  return (
    <section
      aria-label="Featured products"
      aria-roledescription="carousel"
      aria-live="polite"
      className="relative h-[200px] overflow-hidden rounded-3xl md:h-[260px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={active.slug}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={active.name}
            fill
            unoptimized
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Scrim tied to page background #0a0a0a — melts into page on left */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 via-[42%] to-transparent"
      />

      <div className="absolute inset-0 z-10 flex flex-col justify-center p-6 md:p-8">
        <div className="flex max-w-[460px] flex-col gap-2 md:gap-2.5">
          <Badge
            variant="secondary"
            className="w-fit border-white/10 bg-white/10 text-white backdrop-blur">
            {promoLabels[String(index)] ?? "Featured"} • {active.category.name}
          </Badge>
          <h2 className="font-heading text-xl font-semibold tracking-tight text-white md:text-[26px] md:leading-tight">
            {active.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-white md:text-xl">
              {formatPrice(price)}
            </span>
            <span className="text-sm text-white/55 line-through">
              {formatPrice(mrp)}
            </span>
            <Badge className="border-0 bg-violet-600 px-1.5 py-0 text-[11px] font-semibold text-white hover:bg-violet-600">
              {discount}% OFF
            </Badge>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              render={<Link href={`/products/${active.slug}`} />}
              nativeButton={false}
              data-icon="inline-end"
              className="bg-violet-600 text-white shadow hover:bg-violet-700">
              View product
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous slide"
        onClick={prev}
        className="absolute top-1/2 left-3 z-20 hidden size-10 -translate-y-1/2 rounded-full border-0 bg-white/10 text-white shadow-lg backdrop-blur-md hover:bg-white/20 hover:text-white md:inline-flex">
        <ChevronLeftIcon className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next slide"
        onClick={next}
        className="absolute top-1/2 right-3 z-20 hidden size-10 -translate-y-1/2 rounded-full border-0 bg-white/10 text-white shadow-lg backdrop-blur-md hover:bg-white/20 hover:text-white md:inline-flex">
        <ChevronRightIcon className="size-5" />
      </Button>

      {/* Story-style progress dots: active fills over 5s, pauses on hover, disabled for reduced motion */}
      <div className="absolute bottom-3 left-6 z-20 flex gap-1.5 md:left-8">
        {slides.map((slide, i) => {
          const isActive = i === index;
          return (
            <button
              key={slide.slug}
              type="button"
              aria-label={`Go to slide ${i + 1} of ${slides.length}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={`relative h-1.5 overflow-hidden rounded-full transition-colors ${
                isActive ? "w-8 bg-white/25" : (
                  "w-8 bg-white/25 hover:bg-white/40"
                )
              }`}>
              {isActive && !prefersReducedMotion ?
                <span
                  key={index}
                  className="absolute inset-y-0 left-0 bg-white"
                  style={{
                    width: "100%",
                    animation: `heroFill ${AUTOPLAY_MS}ms linear forwards`,
                    animationPlayState: paused ? "paused" : "running",
                  }}
                />
              : isActive ?
                <span className="absolute inset-0 bg-white" />
              : null}
            </button>
          );
        })}
      </div>

      <style>{`@keyframes heroFill { from { width: 0% } to { width: 100% } }`}</style>
    </section>
  );
};

export default ProductsHero;
