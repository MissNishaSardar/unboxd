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
import { Badge } from "@/components/shadcnui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { Separator } from "@/components/shadcnui/separator";
import ProfileForm from "@/components/Settings/ProfileForm";

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

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {initials || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm leading-none font-medium">{user.name}</p>
              <p className="text-muted-foreground truncate text-sm">
                {user.email}
              </p>
            </div>
          </div>
          <Separator />
          <ProfileForm defaultName={user.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Read-only account details</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Verified</span>
            <Badge variant={user.emailVerified ? "secondary" : "outline"}>
              {user.emailVerified ? "Verified" : "Not verified"}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Role</span>
            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
              {user.role}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium">{formatDate(user.createdAt)}</span>
          </div>
          {user.banned && (
            <p className="text-destructive text-sm">This account is banned.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
