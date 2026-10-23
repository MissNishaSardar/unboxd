"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@generated/prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import { userAddressSchema, userAddressType } from "@/lib/zodSchema";

export type UserAddressData = {
  id: string;
  label: string | null;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

const toData = (row: {
  id: string;
  label: string | null;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}): UserAddressData => ({ ...row });

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("UNAUTHORIZED");
  return session.user;
}

export async function getUserAddresses(): Promise<UserAddressData[]> {
  const user = await requireUser();
  const rows = await prisma.userAddress.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
  return rows.map(toData);
}

export type AddressMutationResult =
  | { ok: true; id: string; duplicate?: boolean }
  | {
      ok: false;
      error:
        | "UNAUTHORIZED"
        | "INVALID_INPUT"
        | "NOT_FOUND"
        | "DUPLICATE"
        | "SERVER_ERROR";
    };

// The create or update hit UserAddress_twin_unique, so another tab or
// session wrote the same physical address first.
function isTwinConflict(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === "P2002" &&
    Array.isArray(e.meta?.target) &&
    e.meta.target.includes("UserAddress_twin_unique")
  );
}

export async function createUserAddress(
  input: userAddressType,
): Promise<AddressMutationResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
  }
  const parsed = userAddressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const { label, ...fields } = parsed.data;
  try {
    // One physical place per user. Label is display only, so it stays out of
    // the match. A repeat save converges to the existing row.
    const twin = await prisma.userAddress.findFirst({
      where: { userId: user.id, ...fields },
    });
    if (twin) return { ok: true, id: twin.id, duplicate: true };
    const existingCount = await prisma.userAddress.count({
      where: { userId: user.id },
    });
    const row = await prisma.userAddress.create({
      data: {
        userId: user.id,
        label: label?.trim() ? label.trim() : null,
        ...fields,
        isDefault: existingCount === 0,
      },
    });
    revalidatePath("/myprofile/addresses", "page");
    revalidatePath("/checkout", "page");
    return { ok: true, id: row.id };
  } catch (e) {
    // Check-then-create race: the twin landed between the findFirst and the
    // write, the unique index holds the promise. Converge on the winner.
    if (isTwinConflict(e)) {
      const winner = await prisma.userAddress.findFirst({
        where: { userId: user.id, ...fields },
      });
      if (winner) return { ok: true, id: winner.id, duplicate: true };
    }
    console.error("createUserAddress failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function updateUserAddress(
  id: string,
  input: userAddressType,
): Promise<AddressMutationResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
  }
  const parsed = userAddressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const { label, ...fields } = parsed.data;
  try {
    const existing = await prisma.userAddress.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return { ok: false, error: "NOT_FOUND" };
    }
    // Refuses to edit one row into a twin of another saved address. A
    // label-only edit keeps the physical fields, so it skips the twin check
    // instead of colliding with legacy twin rows that already exist.
    const physicalFields = [
      existing.name === fields.name,
      existing.phone === fields.phone,
      existing.addressLine === fields.addressLine,
      existing.city === fields.city,
      existing.state === fields.state,
      existing.pincode === fields.pincode,
    ];
    if (physicalFields.some((unchanged) => !unchanged)) {
      const twin = await prisma.userAddress.findFirst({
        where: { userId: user.id, id: { not: id }, ...fields },
      });
      if (twin) return { ok: false, error: "DUPLICATE" };
    }
    await prisma.userAddress.update({
      where: { id },
      data: { label: label?.trim() ? label.trim() : null, ...fields },
    });
    revalidatePath("/myprofile/addresses", "page");
    revalidatePath("/checkout", "page");
    return { ok: true, id };
  } catch (e) {
    // Update race: the twin check passed, then another tab inserted the
    // converging row first. The unique index stands in the way.
    if (isTwinConflict(e)) return { ok: false, error: "DUPLICATE" };
    console.error("updateUserAddress failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function deleteUserAddress(
  id: string,
): Promise<AddressMutationResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
  }
  try {
    const existing = await prisma.userAddress.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return { ok: false, error: "NOT_FOUND" };
    }
    await prisma.$transaction(async (tx) => {
      await tx.userAddress.delete({ where: { id } });
      if (existing.isDefault) {
        const next = await tx.userAddress.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
        });
        if (next) {
          await tx.userAddress.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });
    revalidatePath("/myprofile/addresses", "page");
    revalidatePath("/checkout", "page");
    return { ok: true, id };
  } catch (e) {
    console.error("deleteUserAddress failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function setDefaultUserAddress(
  id: string,
): Promise<AddressMutationResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "UNAUTHORIZED" };
  }
  try {
    const existing = await prisma.userAddress.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return { ok: false, error: "NOT_FOUND" };
    }
    await prisma.$transaction([
      prisma.userAddress.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      }),
      prisma.userAddress.update({ where: { id }, data: { isDefault: true } }),
    ]);
    revalidatePath("/myprofile/addresses", "page");
    revalidatePath("/checkout", "page");
    return { ok: true, id };
  } catch (e) {
    console.error("setDefaultUserAddress failed", e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
