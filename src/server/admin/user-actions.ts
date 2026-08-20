"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import { requireAdmin } from "@/lib/guard";
import { userRoleSchema } from "@/lib/zodSchema";

export type AdminUserActionResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "FORBIDDEN"
        | "INVALID_INPUT"
        | "NOT_FOUND"
        | "HAS_ORDERS"
        | "SERVER_ERROR";
    };

export async function setUserRole(
  userId: string,
  role: unknown,
): Promise<AdminUserActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = userRoleSchema.safeParse(role);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  try {
    await auth.api.setRole({
      body: { userId, role: parsed.data },
      headers: await headers(),
    });
    revalidatePath("/admin/users", "page");
    return { ok: true };
  } catch (e) {
    console.error("setUserRole failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function banUser(userId: string): Promise<AdminUserActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  try {
    await auth.api.banUser({ body: { userId } });
    revalidatePath("/admin/users", "page");
    return { ok: true };
  } catch (e) {
    console.error("banUser failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function unbanUser(
  userId: string,
): Promise<AdminUserActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  try {
    await auth.api.unbanUser({ body: { userId } });
    revalidatePath("/admin/users", "page");
    return { ok: true };
  } catch (e) {
    console.error("unbanUser failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function removeUser(
  userId: string,
): Promise<AdminUserActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  try {
    const orderCount = await prisma.order.count({ where: { userId } });
    if (orderCount > 0) {
      return { ok: false, error: "HAS_ORDERS" };
    }
    await auth.api.removeUser({ body: { userId } });
    revalidatePath("/admin/users", "page");
    return { ok: true };
  } catch (e) {
    console.error("removeUser failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function impersonateUser(
  userId: string,
): Promise<AdminUserActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  try {
    await auth.api.impersonateUser({ body: { userId } });
  } catch (e) {
    console.error("impersonateUser failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }

  redirect("/");
}

export async function stopImpersonating(): Promise<AdminUserActionResult> {
  try {
    await auth.api.stopImpersonating({ headers: await headers() });
  } catch (e) {
    console.error("stopImpersonating failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }

  redirect("/");
}
