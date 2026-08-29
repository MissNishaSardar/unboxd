import ProductGridSkeleton from "@/components/Product/ProductGridSkeleton";
import { Skeleton } from "@/components/shadcnui/skeleton";

const Loading = () => {
  return (
    <div className="flex flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="flex w-full flex-col gap-6 lg:w-56 lg:shrink-0">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-8 w-full"
              />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center justify-end">
            <Skeleton className="h-8 w-48" />
          </div>
          <ProductGridSkeleton count={12} />
        </div>
      </div>
    </div>
  );
};

export default Loading;
