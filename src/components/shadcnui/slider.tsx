"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

function Slider({
  className,
  ...props
}: SliderPrimitive.Root.Props<number | readonly number[]>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50",
        className,
      )}
      {...props}>
      <SliderPrimitive.Control className="relative flex h-4 w-full items-center">
        <SliderPrimitive.Track className="bg-muted relative h-1.5 w-full grow overflow-hidden rounded-full">
          <SliderPrimitive.Indicator className="bg-primary absolute h-full rounded-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          index={0}
          aria-label="Minimum price"
          className="bg-background border-primary focus-visible:ring-ring block size-4 shrink-0 rounded-full border shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none"
        />
        <SliderPrimitive.Thumb
          index={1}
          aria-label="Maximum price"
          className="bg-background border-primary focus-visible:ring-ring block size-4 shrink-0 rounded-full border shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none"
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
