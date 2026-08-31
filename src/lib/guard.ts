import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/dbClient/prisma";

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { deletedAt: true, banned: true },
  });
  if (user?.deletedAt || user?.banned) {
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
