"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Route } from "next";
import Link from "next/link";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  BanIcon,
  EyeIcon,
  MoreHorizontalIcon,
  RotateCcwIcon,
  ShieldIcon,
  ShieldOffIcon,
  UnlockIcon,
  UserXIcon,
} from "lucide-react";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Checkbox } from "@/components/shadcnui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcnui/dropdown-menu";
import UserStatusBadge from "@/components/Admin/UserStatusBadge";
import { formatDate } from "@/lib/format";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  deletedAt: string | null;
  createdAt: string;
};

type UsersColumnHandlers = {
  currentUserId: string;
  isPending: boolean;
  onRole: (user: AdminUserRow) => void;
  onBanToggle: (user: AdminUserRow) => void;
  onImpersonate: (user: AdminUserRow) => void;
  onDeactivate: (user: AdminUserRow) => void;
};

const SortHeaderButton = ({
  label,
  sorted,
  onToggle,
  align = "start",
}: {
  label: string;
  sorted: false | "asc" | "desc";
  onToggle: () => void;
  align?: "start" | "end";
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onToggle}
    aria-label={`Sort by ${label}`}>
    {label}
    {sorted === "asc" ?
      <ArrowUpIcon
        data-icon="inline-end"
        aria-hidden="true"
      />
    : sorted === "desc" ?
      <ArrowDownIcon
        data-icon="inline-end"
        aria-hidden="true"
      />
    : <ArrowUpDownIcon
        data-icon="inline-end"
        aria-hidden="true"
      />
    }
    {align === "end" ?
      <span className="sr-only">(right aligned)</span>
    : null}
  </Button>
);

export const getUsersColumns = ({
  currentUserId,
  isPending,
  onRole,
  onBanToggle,
  onImpersonate,
  onDeactivate,
}: UsersColumnHandlers): ColumnDef<AdminUserRow>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) =>
          table.toggleAllPageRowsSelected(checked === true)
        }
        aria-label="Select all users"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        indeterminate={false}
        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
        disabled={!row.getCanSelect()}
        aria-label={`Select user ${row.original.name}`}
      />
    ),
    enableSorting: false,
  },
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <SortHeaderButton
        label="User"
        sorted={column.getIsSorted()}
        onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <Link
        href={`/admin/users/${row.original.id}` as Route}
        className="hover:text-primary block truncate text-sm font-medium underline-offset-4 hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "email",
    accessorKey: "email",
    header: ({ column }) => (
      <SortHeaderButton
        label="Email"
        sorted={column.getIsSorted()}
        onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground block max-w-[220px] truncate text-xs">
        {row.original.email}
      </span>
    ),
  },
  {
    id: "role",
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <Badge variant={row.original.role === "admin" ? "default" : "secondary"}>
        {row.original.role === "admin" ? "Admin" : "Customer"}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <UserStatusBadge
        banned={row.original.banned}
        banExpires={row.original.banExpires}
        deletedAt={row.original.deletedAt}
      />
    ),
    enableSorting: false,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortHeaderButton
        label="Joined"
        sorted={column.getIsSorted()}
        onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="flex justify-end">Actions</span>,
    cell: ({ row }) => {
      const user = row.original;
      const isSelf = user.id === currentUserId;
      return (
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${user.name}`}
                />
              }>
              <MoreHorizontalIcon aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => onRole(user)}
                  disabled={isPending || isSelf}>
                  {user.role === "admin" ?
                    <ShieldOffIcon aria-hidden="true" />
                  : <ShieldIcon aria-hidden="true" />}
                  {user.role === "admin" ?
                    "Demote to customer"
                  : "Promote to admin"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onBanToggle(user)}
                  disabled={isPending || isSelf}>
                  {user.banned ?
                    <UnlockIcon aria-hidden="true" />
                  : <BanIcon aria-hidden="true" />}
                  {user.banned ? "Unban user" : "Ban user"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onImpersonate(user)}
                  disabled={isPending || user.role === "admin"}>
                  <EyeIcon aria-hidden="true" />
                  View as user
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeactivate(user)}
                  disabled={isPending || isSelf}>
                  {user.deletedAt ?
                    <RotateCcwIcon aria-hidden="true" />
                  : <UserXIcon aria-hidden="true" />}
                  {user.deletedAt ? "Reactivate user" : "Deactivate user"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
  },
];
