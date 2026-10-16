"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/shadcnui/button";
import ProductCard, {
  type ProductCardData,
} from "@/components/Product/ProductCard";

type ProductRailProps = {
  title: string;
  products: ProductCardData[];
  href?: string;
  linkLabel?: string;
  cardClass?: string;
  compact?: boolean;
};

const ProductRail = ({
  title,
  products,
  href,
  linkLabel,
  cardClass = "w-56",
  compact,
}: ProductRailProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    setCanScroll(el.scrollWidth > el.clientWidth + 8);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    updateArrows();
    if (!el || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateArrows);
      return () => window.removeEventListener("resize", updateArrows);
    }
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    window.addEventListener("resize", updateArrows);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, products]);

  const scrollPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  if (products.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <div className="flex items-center gap-1">
          {canScroll && (
            <div className="hidden items-center gap-1 md:flex">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`Scroll ${title} left`}
                disabled={!canLeft}
                onClick={() => scrollPage(-1)}>
                <ChevronLeftIcon aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`Scroll ${title} right`}
                disabled={!canRight}
                onClick={() => scrollPage(1)}>
                <ChevronRightIcon aria-hidden="true" />
              </Button>
            </div>
          )}
          {href && (
            <Button
              variant="ghost"
              size="sm"
              render={<Link href={href as never} />}
              nativeButton={false}>
              {linkLabel ?? "View all"}
            </Button>
          )}
        </div>
      </div>
      <div
        ref={scrollerRef}
        onScroll={updateArrows}
        className="flex snap-x scrollbar-none gap-4 overflow-x-auto pb-2">
        {products.map((product) => (
          <div
            key={product.id}
            className={`${cardClass} shrink-0 snap-start`}>
            <ProductCard
              product={product}
              compact={compact}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductRail;
