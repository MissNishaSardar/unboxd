import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import ImpersonationBanner from "@/components/Admin/ImpersonationBanner";
import AppSidebar from "@/components/Layout/AppSidebar";
import PrivateHeader from "@/components/Layout/PrivateHeader";
import { SidebarInset, SidebarProvider } from "@/components/shadcnui/sidebar";
import { TooltipProvider } from "@/components/shadcnui/tooltip";
import { auth } from "@/lib/auth";
import { LayoutProps } from "@/lib/types";

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

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar
          user={{ name: session.user.name, email: session.user.email }}
        />
        <SidebarInset>
          <PrivateHeader />
          {session.session.impersonatedBy && (
            <ImpersonationBanner name={session.user.name} />
          )}
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default PrivateLayout;
