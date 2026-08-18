import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireAdminPage() {
  try {
    return await requireAdmin();
  } catch {
    redirect("/forbidden");
  }
}
