import { UsersIcon } from "lucide-react";
import UserFilters from "@/components/Admin/UserFilters";
import AdminUsersLoadMore from "@/components/Admin/AdminUsersLoadMore";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcnui/empty";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/guard";
import { adminUserListSearchParamsSchema } from "@/lib/zodSchema";
import { getAdminUsers } from "@/server/admin/queries";

export const metadata: Metadata = {
  title: "Users",
  description: "Manage Unboxd users, roles, and bans.",
};

const AdminUsersPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const session = await requireAdminPage();

  const {
    search,
    role,
    page = 1,
  } = adminUserListSearchParamsSchema.parse(await searchParams);

  const { users, total } = await getAdminUsers({
    search,
    role,
    page,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Users
        </h1>
        <p className="text-muted-foreground text-sm">
          {total} user{total === 1 ? "" : "s"}
        </p>
      </div>

      <UserFilters />

      {users.length === 0 ?
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No users found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search or filters.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      : <AdminUsersLoadMore
          initialUsers={users}
          total={total}
          currentUserId={session.user.id}
        />
      }
    </div>
  );
};

export default AdminUsersPage;
