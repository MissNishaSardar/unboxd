"use client";

/* eslint-disable react-hooks/set-state-in-effect -- clearing row selection after filter or sort change is intentional */
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { BanIcon, UserXIcon } from "lucide-react";
import {
  bulkBanUsers,
  bulkDeactivateUsers,
  deactivateUser,
  reactivateUser,
  banUser,
  unbanUser,
  impersonateUser,
  setUserRole,
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
import { Button } from "@/components/shadcnui/button";
import DataTable from "@/components/Admin/DataTable";
import UserFilters from "@/components/Admin/UserFilters";
import {
  getUsersColumns,
  type AdminUserRow,
} from "@/components/Admin/UsersColumns";
import { toast } from "@/components/shadcnui/toast";
import type { RowSelectionState } from "@tanstack/react-table";

const urlSortToSortingState = (urlSort: string): SortingState => {
  if (urlSort === "name_asc") return [{ id: "name", desc: false }];
  if (urlSort === "name_desc") return [{ id: "name", desc: true }];
  if (urlSort === "email_asc") return [{ id: "email", desc: false }];
  if (urlSort === "email_desc") return [{ id: "email", desc: true }];
  if (urlSort === "joined_asc") return [{ id: "createdAt", desc: false }];
  return [{ id: "createdAt", desc: true }];
};

const UsersTable = ({
  users,
  total,
  currentUserId,
}: {
  users: AdminUserRow[];
  total: number;
  currentUserId: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetKey = searchParams.toString();

  const [isPending, setIsPending] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUserRow | null>(
    null,
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    setRowSelection({});
  }, [resetKey]);

  const urlSort = searchParams.get("sort") ?? "joined_desc";
  const sorting = useMemo(() => urlSortToSortingState(urlSort), [urlSort]);

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    if (next.length === 0) return;
    const { id, desc } = next[0];
    const nextUrlSort =
      id === "name" ?
        desc ? "name_desc"
        : "name_asc"
      : id === "email" ?
        desc ? "email_desc"
        : "email_asc"
      : desc ? "joined_desc"
      : "joined_asc";
    const params = new URLSearchParams(searchParams.toString());
    if (nextUrlSort === "joined_desc") params.delete("sort");
    else params.set("sort", nextUrlSort);
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `/admin/users?${query}` : "/admin/users");
  };

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id] === true),
    [rowSelection],
  );

  const handleRole = async (user: AdminUserRow) => {
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

  const handleBanToggle = async (user: AdminUserRow) => {
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

  const handleImpersonate = async (user: AdminUserRow) => {
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
    if (selectedIds.length === 0) return;
    setIsPending(true);
    const result = await bulkBanUsers({ userIds: selectedIds });
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
      setRowSelection({});
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    setIsPending(true);
    const result = await bulkDeactivateUsers({ userIds: selectedIds });
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
      setRowSelection({});
      router.refresh();
    } else {
      toast.add({ title: "Something went wrong", type: "error" });
    }
  };

  const columns = useMemo(
    () =>
      getUsersColumns({
        currentUserId,
        isPending,
        onRole: handleRole,
        onBanToggle: handleBanToggle,
        onImpersonate: handleImpersonate,
        onDeactivate: (user) => setDeactivateTarget(user),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUserId, isPending],
  );

  const toolbar = (
    <div className="flex flex-col gap-3">
      <UserFilters />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs tabular-nums">
          {total} user{total === 1 ? "" : "s"}
          {selectedIds.length > 0 ? ` · ${selectedIds.length} selected` : ""}
        </p>
        {selectedIds.length > 0 && (
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
        )}
      </div>
    </div>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        getRowId={(row) => row.id}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        enableRowSelection={(row) => row.original.id !== currentUserId}
        toolbar={toolbar}
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filters."
        minWidthClass="min-w-[720px]"
      />

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
