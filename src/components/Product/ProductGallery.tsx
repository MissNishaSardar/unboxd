"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type GalleryImage = { url: string; alt: string | null };

const ProductGallery = ({
  images,
  name,
}: {
  images: GalleryImage[];
  name: string;
}) => {
  const [active, setActive] = useState(0);
  const image = images[active] ?? images[0];
  if (!image) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-xl border">
        <Image
          src={image.url}
          alt={image.alt ?? name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, index) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-pressed={index === active}
              className={cn(
                "relative aspect-square w-16 overflow-hidden rounded-md border transition-opacity",
                index === active ? "border-ring" : (
                  "border-border opacity-70 hover:opacity-100"
                ),
              )}>
              <Image
                src={img.url}
                alt={img.alt ?? name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
