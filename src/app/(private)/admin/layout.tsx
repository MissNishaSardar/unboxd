import Link from "next/link";
import SignOutButton from "@/components/Auth/SignOutButton";
import { auth } from "@/lib/auth";
import { LayoutProps } from "@/lib/types";
import { headers } from "next/headers";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/users", label: "Users" },
] as const;

const AdminLayout = async ({ children }: LayoutProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col gap-4 border-r p-4">
        <p className="text-lg font-semibold">unboxd Admin</p>
        <nav className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
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
