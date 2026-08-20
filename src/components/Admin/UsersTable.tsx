"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BanIcon,
  EyeIcon,
  MoreHorizontalIcon,
  ShieldIcon,
  ShieldOffIcon,
  Trash2Icon,
  UnlockIcon,
} from "lucide-react";
import {
  banUser,
  impersonateUser,
  removeUser,
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
import { formatDate } from "@/lib/format";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
};

const UsersTable = ({ users }: { users: UserRow[] }) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<UserRow | null>(null);

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

  const handleRemove = async () => {
    if (!removeTarget) return;
    setIsPending(true);
    const result = await removeUser(removeTarget.id);
    setIsPending(false);
    setRemoveTarget(null);
    if (result.ok) {
      toast.add({ title: "User removed", type: "success" });
      router.refresh();
    } else if (result.error === "HAS_ORDERS") {
      toast.add({
        title: "Cannot remove: user has orders",
        description: "Consider banning the user instead.",
        type: "error",
      });
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? "Admin" : "Customer"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.banned ?
                      <Badge variant="destructive">Banned</Badge>
                    : <span className="text-muted-foreground text-sm">
                        Active
                      </span>
                    }
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
                              disabled={isPending}>
                              {user.role === "admin" ?
                                <ShieldOffIcon aria-hidden="true" />
                              : <ShieldIcon aria-hidden="true" />}
                              {user.role === "admin" ?
                                "Demote to customer"
                              : "Promote to admin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleBan(user)}
                              disabled={isPending}>
                              {user.banned ?
                                <UnlockIcon aria-hidden="true" />
                              : <BanIcon aria-hidden="true" />}
                              {user.banned ? "Unban user" : "Ban user"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleImpersonate(user)}
                              disabled={isPending}>
                              <EyeIcon aria-hidden="true" />
                              View as user
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setRemoveTarget(user)}
                              disabled={isPending}>
                              <Trash2Icon aria-hidden="true" />
                              Remove user
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}>
        <AlertDialogContent>
          <AlertDialogTitle>Remove {removeTarget?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the account. Users with orders can&apos;t
            be removed; ban them instead.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep user</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleRemove}
              disabled={isPending}>
              Remove user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UsersTable;
