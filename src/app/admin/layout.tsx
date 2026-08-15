import SignOutButton from "@/components/auth/SignOutButton";
import { auth } from "@/lib/auth";
import { LayoutProps } from "@/lib/types";
import { headers } from "next/headers";

const AdminLayout = async ({ children }: LayoutProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col gap-4 border-r p-4">
        <p className="text-lg font-semibold">unboxd Admin</p>
        {session && (
          <div>
            <p className="font-medium">{session.user.name}</p>
            <p className="text-muted-foreground text-sm">
              {session.user.email}
            </p>
          </div>
        )}
        <SignOutButton />
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

export default AdminLayout;
