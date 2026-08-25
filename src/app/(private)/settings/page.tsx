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
import AccountDetails from "@/components/Settings/AccountDetails";
import ChangePasswordForm from "@/components/Settings/ChangePasswordForm";
import DangerZone from "@/components/Settings/DangerZone";
import ProfileHero from "@/components/Settings/ProfileHero";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

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
  const isAdmin = user.role === "admin";

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

      {/* 1. Hero Profile Section — avatar + name + bio */}
      <ProfileHero
        name={user.name}
        image={user.image ?? null}
        initials={initials}
        bio={user.bio ?? null}
      />

      {/* 2. Account Details — read-only grid: email (full-width) + role/memberSince */}
      <AccountDetails
        email={user.email}
        role={user.role}
        memberSince={memberSince}
        emailVerified={user.emailVerified}
        banned={user.banned}
      />

      {/* Security — always visible (was Security tab) */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Reset your password</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* 3. Danger Zone — hidden for admins, red for regular users */}
      {!isAdmin && <DangerZone />}
    </div>
  );
};

export default SettingsPage;
