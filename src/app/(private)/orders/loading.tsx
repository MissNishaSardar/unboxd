import { Skeleton } from "@/components/shadcnui/skeleton";

const Loading = () => {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-16 w-full rounded-2xl"
          />
        ))}
      </div>
    </div>
  );
};

export default Loading;
