import { Badge } from "@/components/shadcnui/badge";
import { getUserStatusConfig } from "@/lib/users/status";
import { cn } from "@/lib/utils";

const UserStatusBadge = ({
  banned,
  banExpires,
  deletedAt,
}: {
  banned?: boolean | null;
  banExpires?: string | null;
  deletedAt?: string | null;
}) => {
  const config = getUserStatusConfig({ banned, banExpires, deletedAt });
  const Icon = config.icon;
  return (
    <Badge
      variant={config.badgeVariant}
      className={cn(config.badgeClass)}>
      <Icon aria-hidden="true" />
      {config.label}
    </Badge>
  );
};

export default UserStatusBadge;
