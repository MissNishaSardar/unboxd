"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
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
  | { ok: true; id: string }
  | {
      ok: false;
      error: "UNAUTHORIZED" | "INVALID_INPUT" | "NOT_FOUND" | "SERVER_ERROR";
    };

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
    await prisma.userAddress.update({
      where: { id },
      data: { label: label?.trim() ? label.trim() : null, ...fields },
    });
    revalidatePath("/myprofile/addresses", "page");
    revalidatePath("/checkout", "page");
    return { ok: true, id };
  } catch (e) {
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
