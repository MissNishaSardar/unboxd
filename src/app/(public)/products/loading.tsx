import ProductGridSkeleton from "@/components/Product/ProductGridSkeleton";
import { Skeleton } from "@/components/shadcnui/skeleton";

const Loading = () => {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-[200px] w-full rounded-3xl md:h-[260px]" />
      <Skeleton className="h-4 w-32" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-8 w-24 shrink-0 rounded-full"
          />
        ))}
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <ProductGridSkeleton count={12} />
      </div>
    </div>
  );
};

export default Loading;
