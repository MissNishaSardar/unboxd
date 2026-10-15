import AdminUsersLoadMore from "@/components/Admin/AdminUsersLoadMore";
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

  const { search, role, sort } = adminUserListSearchParamsSchema.parse(
    await searchParams,
  );

  const { users, total } = await getAdminUsers({
    search,
    role,
    sort,
    page: 1,
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

      <AdminUsersLoadMore
        initialUsers={users}
        total={total}
        currentUserId={session.user.id}
      />
    </div>
  );
};

export default AdminUsersPage;
