import { cookies, headers } from "next/headers";
import ImpersonationBanner from "@/components/Admin/ImpersonationBanner";
import AdminHeader from "@/components/Layout/AdminHeader";
import AdminSidebar from "@/components/Layout/AdminSidebar";
import { SidebarInset, SidebarProvider } from "@/components/shadcnui/sidebar";
import { TooltipProvider } from "@/components/shadcnui/tooltip";
import { auth } from "@/lib/auth";
import { requireAdminPage } from "@/lib/guard";
import { LayoutProps } from "@/lib/types";

const AdminLayout = async ({ children }: LayoutProps) => {
  await requireAdminPage();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AdminSidebar />
        <SidebarInset>
          <AdminHeader />
          {session?.session.impersonatedBy && (
            <ImpersonationBanner name={session.user.name} />
          )}
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default AdminLayout;
