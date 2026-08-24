import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import { formatDate } from "@/lib/format";
import AccountDetails from "@/components/Settings/AccountDetails";
import ChangePasswordForm from "@/components/Settings/ChangePasswordForm";
import ProfileHero from "@/components/Settings/ProfileHero";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Unboxd profile and account settings.",
};

const AdminSettingsPage = async () => {
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
      bio: true,
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

  const memberSince = formatDate(user.createdAt);

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

      <ProfileHero
        name={user.name}
        image={user.image ?? null}
        initials={initials}
        bio={user.bio ?? null}
      />

      <AccountDetails
        email={user.email}
        role={user.role}
        memberSince={memberSince}
        emailVerified={user.emailVerified}
        banned={user.banned}
      />

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Reset your password</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* Danger Zone hidden for admins */}
    </div>
  );
};

export default AdminSettingsPage;
