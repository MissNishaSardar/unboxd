"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";

export type DeleteAccountResult =
  | { ok: true }
  | {
      ok: false;
      error:
        "FORBIDDEN" | "ADMIN_PROTECTED" | "ALREADY_DELETED" | "SERVER_ERROR";
    };

export async function deleteAccount(): Promise<DeleteAccountResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "FORBIDDEN" };

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, deletedAt: true },
    });
    if (!user) return { ok: false, error: "FORBIDDEN" };
    if (user.deletedAt) return { ok: false, error: "ALREADY_DELETED" };

    // Admin protection — hide danger zone, but harden server too
    if (user.role === "admin") {
      return { ok: false, error: "ADMIN_PROTECTED" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { deletedAt: new Date() },
    });
    await prisma.session.deleteMany({
      where: { userId: session.user.id },
    });

    return { ok: true };
  } catch (e) {
    console.error("deleteAccount failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
