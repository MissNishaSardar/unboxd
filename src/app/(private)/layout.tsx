import SignOutButton from "@/components/Auth/SignOutButton";
import ImpersonationBanner from "@/components/Admin/ImpersonationBanner";
import { auth } from "@/lib/auth";
import { LayoutProps } from "@/lib/types";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const PrivateLayout = async ({ children }: LayoutProps) => {
  const headerList = await headers();
  const shell = headerList.get("x-route-shell");

  if (shell === "admin") {
    return <>{children}</>;
  }

  const session = await auth.api.getSession({
    headers: headerList,
  });

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col gap-4 border-r p-4">
        <div>
          <p className="font-medium">{session.user.name}</p>
          <p className="text-muted-foreground text-sm">{session.user.email}</p>
        </div>
        <SignOutButton />
      </aside>
      <div className="flex flex-1 flex-col">
        {session.session.impersonatedBy && (
          <ImpersonationBanner name={session.user.name} />
        )}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default PrivateLayout;
