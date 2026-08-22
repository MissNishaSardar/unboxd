import { UsersIcon } from "lucide-react";
import UserFilters from "@/components/Admin/UserFilters";
import UsersTable from "@/components/Admin/UsersTable";
import Pagination from "@/components/Product/Pagination";
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
  await requireAdminPage();

  const {
    search,
    role,
    page = 1,
  } = adminUserListSearchParamsSchema.parse(await searchParams);

  const { users, total, totalPages } = await getAdminUsers({
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
      : <UsersTable users={users} />}

      {users.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pathname="/admin/users"
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
