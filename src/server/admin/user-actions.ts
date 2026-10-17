"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import { DAY_MS } from "@/lib/constants";
import { requireAdmin } from "@/lib/guard";
import {
  banUserSchema,
  bulkUserIdsSchema,
  userRoleSchema,
} from "@/lib/zodSchema";

export type AdminUserActionResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "FORBIDDEN"
        | "INVALID_INPUT"
        | "NOT_FOUND"
        | "HAS_ORDERS"
        | "SELF_ACTION"
        | "LAST_ADMIN"
        | "ALREADY_DEACTIVATED"
        | "SERVER_ERROR";
    };

export type BulkUserActionResult =
  | { ok: true; updated: number; skipped: number }
  | { ok: false; error: "FORBIDDEN" | "INVALID_INPUT" | "SERVER_ERROR" };

async function getActiveAdminCount(): Promise<number> {
  return prisma.user.count({
    where: { role: "admin", banned: false, deletedAt: null },
  });
}

async function getAdminCount(): Promise<number> {
  return prisma.user.count({ where: { role: "admin", deletedAt: null } });
}

export async function setUserRole(
  userId: string,
  role: unknown,
): Promise<AdminUserActionResult> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = userRoleSchema.safeParse(role);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  if (session.user.id === userId && parsed.data === "user") {
    return { ok: false, error: "SELF_ACTION" };
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, banned: true, deletedAt: true },
    });
    if (!target) return { ok: false, error: "NOT_FOUND" };
    if (target.role === "admin" && parsed.data === "user") {
      const activeCount = await getActiveAdminCount();
      const isActiveAdmin = target.banned === false && target.deletedAt == null;
      if (isActiveAdmin && activeCount <= 1) {
        return { ok: false, error: "LAST_ADMIN" };
      }
      const totalCount = await getAdminCount();
      if (!isActiveAdmin && totalCount <= 1) {
        return { ok: false, error: "LAST_ADMIN" };
      }
    }

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

export async function banUser(
  userId: string,
  input?: unknown,
): Promise<AdminUserActionResult> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }
  if (session.user.id === userId) {
    return { ok: false, error: "SELF_ACTION" };
  }

  let banReason: string | undefined;
  let banExpiresIn: number | undefined;
  if (input !== undefined && input !== null) {
    const parsed = banUserSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
    if (parsed.data.reason) banReason = parsed.data.reason;
    if (parsed.data.expiryDays) {
      // Better Auth takes ban expiry in seconds.
      banExpiresIn = (DAY_MS / 1000) * parsed.data.expiryDays;
    }
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, banned: true, deletedAt: true },
    });
    if (!target) return { ok: false, error: "NOT_FOUND" };
    if (target.role === "admin" && !target.banned && !target.deletedAt) {
      const activeCount = await getActiveAdminCount();
      if (activeCount <= 1) return { ok: false, error: "LAST_ADMIN" };
    }
    await auth.api.banUser({
      body: {
        userId,
        ...(banReason && { banReason }),
        ...(banExpiresIn && { banExpiresIn }),
      },
      headers: await headers(),
    });
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
    await auth.api.unbanUser({ body: { userId }, headers: await headers() });
    revalidatePath("/admin/users", "page");
    return { ok: true };
  } catch (e) {
    console.error("unbanUser failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function deactivateUser(
  userId: string,
): Promise<AdminUserActionResult> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }
  if (session.user.id === userId) {
    return { ok: false, error: "SELF_ACTION" };
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, deletedAt: true, banned: true },
    });
    if (!target) return { ok: false, error: "NOT_FOUND" };
    if (target.deletedAt) return { ok: false, error: "ALREADY_DEACTIVATED" };
    if (target.role === "admin") {
      const isActive = !target.banned && !target.deletedAt;
      if (isActive) {
        const activeCount = await getActiveAdminCount();
        if (activeCount <= 1) return { ok: false, error: "LAST_ADMIN" };
      } else {
        const totalCount = await getAdminCount();
        if (totalCount <= 1) return { ok: false, error: "LAST_ADMIN" };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
    await prisma.session.deleteMany({ where: { userId } });
    revalidatePath("/admin/users", "page");
    return { ok: true };
  } catch (e) {
    console.error("deactivateUser failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function reactivateUser(
  userId: string,
): Promise<AdminUserActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { deletedAt: true },
    });
    if (!target) return { ok: false, error: "NOT_FOUND" };
    if (!target.deletedAt) return { ok: false, error: "INVALID_INPUT" };
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });
    revalidatePath("/admin/users", "page");
    return { ok: true };
  } catch (e) {
    console.error("reactivateUser failed", e);
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
    await auth.api.impersonateUser({
      body: { userId },
      headers: await headers(),
    });
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

export async function bulkBanUsers(
  input: unknown,
): Promise<BulkUserActionResult> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }
  const parsed = bulkUserIdsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const userIds = [...new Set(parsed.data.userIds)];

  let updated = 0;
  let skipped = 0;
  for (const userId of userIds) {
    if (userId === session.user.id) {
      skipped += 1;
      continue;
    }
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, banned: true, deletedAt: true },
    });
    if (!target || target.banned) {
      skipped += 1;
      continue;
    }
    if (target.role === "admin" && !target.deletedAt) {
      const activeCount = await getActiveAdminCount();
      if (activeCount <= 1) {
        skipped += 1;
        continue;
      }
    }
    try {
      await auth.api.banUser({ body: { userId }, headers: await headers() });
      updated += 1;
    } catch {
      skipped += 1;
    }
  }
  revalidatePath("/admin/users", "page");
  return { ok: true, updated, skipped };
}

export async function bulkDeactivateUsers(
  input: unknown,
): Promise<BulkUserActionResult> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { ok: false, error: "FORBIDDEN" };
  }
  const parsed = bulkUserIdsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const userIds = [...new Set(parsed.data.userIds)];

  let updated = 0;
  let skipped = 0;
  for (const userId of userIds) {
    if (userId === session.user.id) {
      skipped += 1;
      continue;
    }
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, banned: true, deletedAt: true },
    });
    if (!target || target.deletedAt) {
      skipped += 1;
      continue;
    }
    if (target.role === "admin") {
      const isActive = !target.banned && !target.deletedAt;
      const count =
        isActive ? await getActiveAdminCount() : await getAdminCount();
      if (count <= 1) {
        skipped += 1;
        continue;
      }
    }
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });
      await prisma.session.deleteMany({ where: { userId } });
      updated += 1;
    } catch {
      skipped += 1;
    }
  }
  revalidatePath("/admin/users", "page");
  return { ok: true, updated, skipped };
}
