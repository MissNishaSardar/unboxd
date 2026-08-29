import { Skeleton } from "@/components/shadcnui/skeleton";

const ProductGridSkeleton = ({ count = 12 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-xl border border-transparent">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex flex-col gap-2 px-1">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex items-center justify-between gap-2 px-1 pb-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGridSkeleton;
