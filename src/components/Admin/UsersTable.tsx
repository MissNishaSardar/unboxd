"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BanIcon,
  EyeIcon,
  MoreHorizontalIcon,
  RotateCcwIcon,
  ShieldIcon,
  ShieldOffIcon,
  UserXIcon,
  UnlockIcon,
} from "lucide-react";
import {
  banUser,
  bulkBanUsers,
  bulkDeactivateUsers,
  deactivateUser,
  impersonateUser,
  reactivateUser,
  setUserRole,
  unbanUser,
} from "@/server/admin/user-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/shadcnui/alert-dialog";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent } from "@/components/shadcnui/card";
import { Checkbox } from "@/components/shadcnui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcnui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import { toast } from "@/components/shadcnui/toast";
import UserStatusBadge from "@/components/Admin/UserStatusBadge";
import { formatDate } from "@/lib/format";

type UserRow = {
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

const UsersTable = ({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<UserRow | null>(
    null,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = users.length > 0 && selected.size === users.length;

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(users.map((u) => u.id)));
    } else {
      setSelected(new Set());
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRole = async (user: UserRow) => {
    setIsPending(true);
    const result = await setUserRole(
      user.id,
      user.role === "admin" ? "user" : "admin",
    );
    setIsPending(false);
    if (result.ok) {
      toast.add({
        title:
          user.role === "admin" ?
            "User demoted to customer"
          : "User promoted to admin",
        type: "success",
      });
      router.refresh();
    } else if (result.error === "SELF_ACTION") {
      toast.add({ title: "You cannot change your own role", type: "error" });
    } else if (result.error === "LAST_ADMIN") {
      toast.add({ title: "At least one active admin required", type: "error" });
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const handleBan = async (user: UserRow) => {
    setIsPending(true);
    const result =
      user.banned ? await unbanUser(user.id) : await banUser(user.id);
    setIsPending(false);
    if (result.ok) {
      toast.add({
        title: user.banned ? "User unbanned" : "User banned",
        type: "success",
      });
      router.refresh();
    } else if (result.error === "SELF_ACTION") {
      toast.add({ title: "You cannot ban yourself", type: "error" });
    } else if (result.error === "LAST_ADMIN") {
      toast.add({ title: "At least one active admin required", type: "error" });
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const handleImpersonate = async (user: UserRow) => {
    setIsPending(true);
    const result = await impersonateUser(user.id);
    setIsPending(false);
    if (!result.ok) {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsPending(true);
    const isDeactivated = !!deactivateTarget.deletedAt;
    const result =
      isDeactivated ?
        await reactivateUser(deactivateTarget.id)
      : await deactivateUser(deactivateTarget.id);
    setIsPending(false);
    setDeactivateTarget(null);
    if (result.ok) {
      toast.add({
        title: isDeactivated ? "User reactivated" : "User deactivated",
        type: "success",
      });
      router.refresh();
    } else if (result.error === "SELF_ACTION") {
      toast.add({ title: "You cannot deactivate yourself", type: "error" });
    } else if (result.error === "LAST_ADMIN") {
      toast.add({ title: "At least one active admin required", type: "error" });
    } else if (result.error === "ALREADY_DEACTIVATED") {
      toast.add({ title: "User already deactivated", type: "error" });
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const handleBulkBan = async () => {
    if (selected.size === 0) return;
    setIsPending(true);
    const result = await bulkBanUsers({ userIds: [...selected] });
    setIsPending(false);
    if (result.ok) {
      toast.add({
        title: `${result.updated} user${result.updated === 1 ? "" : "s"} suspended`,
        type: "success",
      });
      if (result.skipped > 0) {
        toast.add({
          title: `${result.skipped} skipped (self / already banned / last admin)`,
          type: "info",
        });
      }
      setSelected(new Set());
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selected.size === 0) return;
    setIsPending(true);
    const result = await bulkDeactivateUsers({ userIds: [...selected] });
    setIsPending(false);
    if (result.ok) {
      toast.add({
        title: `${result.updated} user${result.updated === 1 ? "" : "s"} deactivated`,
        type: "success",
      });
      if (result.skipped > 0) {
        toast.add({
          title: `${result.skipped} skipped (self / already deactivated / last admin)`,
          type: "info",
        });
      }
      setSelected(new Set());
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {selected.size > 0 && (
          <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
            <p className="text-sm">{selected.size} users selected</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkBan}
                disabled={isPending}>
                <BanIcon
                  data-icon="inline-start"
                  aria-hidden="true"
                />
                Suspend
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDeactivate}
                disabled={isPending}>
                <UserXIcon
                  data-icon="inline-start"
                  aria-hidden="true"
                />
                Deactivate
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => toggleAll(checked === true)}
                      aria-label="Select all users"
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(user.id)}
                          onCheckedChange={() => toggle(user.id)}
                          aria-label={`Select user ${user.name}`}
                          disabled={isSelf}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="truncate text-sm font-medium">
                          {user.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {user.email}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }>
                          {user.role === "admin" ? "Admin" : "Customer"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <UserStatusBadge
                          banned={user.banned}
                          banExpires={user.banExpires}
                          deletedAt={user.deletedAt}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
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
                                  onClick={() => handleRole(user)}
                                  disabled={isPending || isSelf}>
                                  {user.role === "admin" ?
                                    <ShieldOffIcon aria-hidden="true" />
                                  : <ShieldIcon aria-hidden="true" />}
                                  {user.role === "admin" ?
                                    "Demote to customer"
                                  : "Promote to admin"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleBan(user)}
                                  disabled={isPending || isSelf}>
                                  {user.banned ?
                                    <UnlockIcon aria-hidden="true" />
                                  : <BanIcon aria-hidden="true" />}
                                  {user.banned ? "Unban user" : "Ban user"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleImpersonate(user)}
                                  disabled={isPending || user.role === "admin"}>
                                  <EyeIcon aria-hidden="true" />
                                  View as user
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setDeactivateTarget(user)}
                                  disabled={isPending || isSelf}>
                                  {user.deletedAt ?
                                    <RotateCcwIcon aria-hidden="true" />
                                  : <UserXIcon aria-hidden="true" />}
                                  {user.deletedAt ?
                                    "Reactivate user"
                                  : "Deactivate user"}
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {deactivateTarget?.deletedAt ? "Reactivate" : "Deactivate"}{" "}
            {deactivateTarget?.name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deactivateTarget?.deletedAt ?
              "This will restore the account and allow login again."
            : "This deactivates the account and blocks login. Historical orders are preserved. You can reactivate later."
            }
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={deactivateTarget?.deletedAt ? "default" : "destructive"}
              onClick={handleDeactivate}
              disabled={isPending}>
              {deactivateTarget?.deletedAt ? "Reactivate" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UsersTable;
