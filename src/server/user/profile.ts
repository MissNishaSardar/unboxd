import prisma from "@/lib/dbClient/prisma";

export type ProfileView = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  initials: string;
  emailVerified: boolean;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  deletedAt: string | null;
  createdAt: string;
};

const computeInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export async function getProfileView(
  userId: string,
): Promise<ProfileView | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
      deletedAt: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    initials: computeInitials(user.name),
    emailVerified: user.emailVerified,
    role: user.role ?? "user",
    banned: user.banned ?? false,
    banReason: user.banReason ?? null,
    banExpires: user.banExpires ? user.banExpires.toISOString() : null,
    deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  };
}
