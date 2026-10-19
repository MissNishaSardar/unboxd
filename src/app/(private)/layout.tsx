import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import PrivateLayoutShell from "@/components/Layout/PrivateLayoutShell";
import { auth } from "@/lib/auth";
import { LayoutProps } from "@/lib/types";

const PrivateLayout = async ({ children }: LayoutProps) => {
  const headerList = await headers();
  const session = await auth.api.getSession({
    headers: headerList,
  });

  if (!session) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <PrivateLayoutShell defaultOpen={defaultOpen}>
      {children}
    </PrivateLayoutShell>
  );
};

export default PrivateLayout;
