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
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-8 w-full"
              />
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
        </aside>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;
