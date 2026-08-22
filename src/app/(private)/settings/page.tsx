import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Unboxd profile and account settings.",
};
import prisma from "@/lib/dbClient/prisma";
import { formatDate } from "@/lib/format";
import SettingsTabs from "@/components/Settings/SettingsTabs";

const SettingsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      role: true,
      banned: true,
      emailVerified: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/auth/login");

  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile and account
        </p>
      </div>
      <SettingsTabs
        defaultName={user.name}
        defaultImage={user.image ?? null}
        email={user.email}
        emailVerified={user.emailVerified}
        role={user.role}
        banned={user.banned}
        memberSince={formatDate(user.createdAt)}
        initials={initials}
      />
    </div>
  );
};

export default SettingsPage;
