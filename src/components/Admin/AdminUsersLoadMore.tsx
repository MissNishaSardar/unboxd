"use client";

/* eslint-disable react-hooks/set-state-in-effect -- syncing URL query state to list after filter change is intentional */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import UsersTable from "@/components/Admin/UsersTable";
import { Button } from "@/components/shadcnui/button";
import { toast } from "@/components/shadcnui/toast";

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

const AdminUsersLoadMore = ({
  initialUsers,
  total,
  currentUserId,
}: {
  initialUsers: UserRow[];
  total: number;
  currentUserId: string;
}) => {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState(initialUsers);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
    setPage(1);
    setError(null);
  }, [initialUsers]);

  const canLoadMore = users.length < total;

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(nextPage));
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        toast.add({ title: "Could not load more users", type: "error" });
        setError("Could not load more users. Try again.");
        return;
      }
      const data = (await res.json()) as { users: UserRow[] };
      setUsers((prev) => [...prev, ...data.users]);
      setPage(nextPage);
    } catch {
      toast.add({ title: "Could not load more users", type: "error" });
      setError("Could not load more users. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <UsersTable
        users={users}
        total={total}
        currentUserId={currentUserId}
      />
      {canLoadMore && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-muted-foreground text-xs tabular-nums">
            Showing {users.length} of {total}
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={loading}
            className="w-full rounded-full px-8 sm:w-auto">
            {loading ? "Loading" : "Load more"}
          </Button>
          {error && (
            <p
              role="alert"
              className="text-destructive text-xs">
              {error}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default AdminUsersLoadMore;
