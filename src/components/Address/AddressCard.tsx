"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/shadcnui/badge";
import { cn } from "@/lib/utils";
import type { UserAddressData } from "@/server/user/addresses";

type AddressCardProps = {
  address: UserAddressData;
  selected?: boolean;
  onSelect?: () => void;
  actions?: ReactNode;
};

const AddressCard = ({
  address,
  selected,
  onSelect,
  actions,
}: AddressCardProps) => {
  return (
    <div
      role={onSelect ? "radio" : undefined}
      aria-checked={onSelect ? selected : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={
        onSelect ?
          (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect();
            }
          }
        : undefined
      }
      className={cn(
        "flex flex-col gap-1 rounded-xl border p-4 text-left",
        onSelect && "cursor-pointer",
        selected ?
          "border-primary ring-primary/30 ring-2"
        : "border-border hover:border-foreground/30",
      )}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{address.name}</span>
        {address.label && <Badge variant="secondary">{address.label}</Badge>}
        {address.isDefault && <Badge>Default</Badge>}
      </div>
      <p className="text-muted-foreground text-sm">
        {address.addressLine}, {address.city}, {address.state} {address.pincode}
      </p>
      <p className="text-muted-foreground text-sm tabular-nums">
        +91 {address.phone}
      </p>
      {actions && (
        <div
          className="flex flex-wrap gap-1 pt-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default AddressCard;
