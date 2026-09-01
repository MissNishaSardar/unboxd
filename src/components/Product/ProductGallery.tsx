"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ZoomInIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPlaceholderPhotoUrl,
  resolveProductImageUrl,
} from "@/lib/placeholder";

export type GalleryImage = { url: string; alt: string | null };

const ProductGallery = ({
  images,
  name,
  slug,
}: {
  images: GalleryImage[];
  name: string;
  slug?: string;
}) => {
  const seed = slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const baseResolved =
    images.length > 0 ?
      images.map((img, index) => ({
        url: resolveProductImageUrl(img.url, seed, index),
        alt: img.alt,
      }))
    : [{ url: getPlaceholderPhotoUrl(seed), alt: name }];

  // Fill up to 4 thumbnails so strip is never empty — use local placeholder, not fake picsum
  const resolvedImages = (() => {
    if (baseResolved.length >= 4) return baseResolved;
    const filled = [...baseResolved];
    while (filled.length < 4) {
      filled.push({
        url: "/placeholder.svg",
        alt: `${name} — no image`,
      });
    }
    return filled;
  })();

  const [active, setActive] = useState(0);
  const image = resolvedImages[active] ?? resolvedImages[0]!;
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [failed, setFailed] = useState<Set<string>>(new Set());

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ x, y });
  };

  const getSrc = (url: string) => (failed.has(url) ? "/placeholder.svg" : url);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        className="bg-muted group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl border">
        <Image
          src={getSrc(image.url)}
          alt={image.alt ?? name}
          fill
          unoptimized
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className={cn(
            "object-cover transition-transform duration-300 ease-out will-change-transform",
            isZooming && !failed.has(image.url) && "scale-[1.7]",
          )}
          style={
            isZooming && !failed.has(image.url) ?
              { transformOrigin: `${zoom.x}% ${zoom.y}%` }
            : undefined
          }
          onError={() => setFailed((prev) => new Set(prev).add(image.url))}
        />
        <span className="bg-background/80 text-foreground pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs opacity-0 shadow backdrop-blur transition-opacity group-hover:opacity-100">
          <ZoomInIcon
            className="size-3.5"
            aria-hidden="true"
          />
          Hover to zoom
        </span>
      </div>
      {resolvedImages.length > 1 && (
        <div className="flex gap-2">
          {resolvedImages.map((img, index) => (
            <button
              key={`${img.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${resolvedImages.length}`}
              aria-pressed={index === active}
              className={cn(
                "relative aspect-square w-16 overflow-hidden rounded-md border transition-opacity",
                index === active ? "border-ring" : (
                  "border-border opacity-70 hover:opacity-100"
                ),
              )}>
              <Image
                src={getSrc(img.url)}
                alt={img.alt ?? name}
                fill
                unoptimized
                sizes="64px"
                className="object-cover"
                onError={() => setFailed((prev) => new Set(prev).add(img.url))}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
