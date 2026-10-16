import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";

type AdminEmptyStateProps = {
  title: string;
  message: string;
  actionHref?: Route;
  actionLabel?: string;
  className?: string;
};

const AdminEmptyState = ({
  title,
  message,
  actionHref,
  actionLabel,
  className,
}: AdminEmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-start gap-1 py-1", className)}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground text-sm">{message}</p>
      {actionHref && actionLabel && (
        <Button
          render={<Link href={actionHref} />}
          nativeButton={false}
          variant="outline"
          size="sm"
          className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default AdminEmptyState;
