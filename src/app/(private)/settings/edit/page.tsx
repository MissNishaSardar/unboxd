import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeftIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/dbClient/prisma";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import ProfileForm from "@/components/Settings/ProfileForm";

export const metadata: Metadata = {
  title: "Edit Profile",
  description: "Update your Unboxd profile name and avatar.",
};

const EditProfilePage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true },
  });
  if (!user) redirect("/auth/login");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={
          <Link href={"/settings" as never}>
            <ArrowLeftIcon aria-hidden="true" />
            Back to settings
          </Link>
        }
        nativeButton={false}
      />
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Edit Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Update your display name and avatar
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Changes are saved to your account immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultName={user.name}
            defaultImage={user.image ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfilePage;
