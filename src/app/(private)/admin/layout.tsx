import { cookies } from "next/headers";
import AdminHeader from "@/components/Layout/AdminHeader";
import AdminSidebar from "@/components/Layout/AdminSidebar";
import { SidebarInset, SidebarProvider } from "@/components/shadcnui/sidebar";
import { TooltipProvider } from "@/components/shadcnui/tooltip";
import { requireAdminPage } from "@/lib/guard";
import Container from "@/components/Layout/Container";
import { LayoutProps } from "@/lib/types";

const AdminLayout = async ({ children }: LayoutProps) => {
  await requireAdminPage();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AdminSidebar />
        <SidebarInset>
          <AdminHeader />
          <main className="flex-1 py-6">
            <Container className="max-w-none">{children}</Container>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default AdminLayout;
