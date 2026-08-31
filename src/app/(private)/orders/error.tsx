"use client";

import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/shadcnui/button";

const Error = ({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <AlertTriangleIcon
        aria-hidden="true"
        className="text-destructive size-10"
      />
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold">
          Something went wrong
        </h2>
        <p className="text-muted-foreground text-sm">
          We couldn&apos;t load your orders. Please try again.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
};

export default Error;
