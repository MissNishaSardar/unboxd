import SignOutButton from "@/components/auth/SignOutButton";
import { LayoutProps } from "@/lib/types";

const AdminLayout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col gap-4 border-r p-4">
        <p className="text-lg font-semibold">unboxd Admin</p>
        <SignOutButton />
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

export default AdminLayout;
