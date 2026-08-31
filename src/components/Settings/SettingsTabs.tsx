"use client";

import { Badge } from "@/components/shadcnui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { Separator } from "@/components/shadcnui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcnui/tabs";
import ChangePasswordForm from "@/components/Settings/ChangePasswordForm";
import ProfileForm from "@/components/Settings/ProfileForm";

type SettingsTabsProps = {
  defaultName: string;
  defaultImage: string | null;
  email: string;
  emailVerified: boolean;
  role: string;
  banned: boolean;
  memberSince: string;
  initials: string;
};

const SettingsTabs = ({
  defaultName,
  defaultImage,
  email,
  emailVerified,
  role,
  banned,
  memberSince,
  initials,
}: SettingsTabsProps) => {
  return (
    <Tabs
      defaultValue="profile"
      className="w-full">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      <TabsContent
        value="profile"
        className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your display name and avatar
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              {defaultImage ?
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={defaultImage}
                  alt=""
                  aria-hidden="true"
                  width={48}
                  height={48}
                  className="size-12 shrink-0 rounded-full object-cover"
                />
              : <div
                  aria-hidden="true"
                  className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  {initials || "?"}
                </div>
              }
              <div className="min-w-0">
                <p className="text-sm leading-none font-medium">
                  {defaultName}
                </p>
                <p className="text-muted-foreground truncate text-sm">
                  {email}
                </p>
              </div>
            </div>
            <Separator />
            <ProfileForm
              defaultName={defaultName}
              defaultImage={defaultImage}
            />
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
              <span className="font-medium">{email}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Verified</span>
              <Badge variant={emailVerified ? "secondary" : "outline"}>
                {emailVerified ? "Verified" : "Not verified"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Role</span>
              <Badge variant={role === "admin" ? "default" : "secondary"}>
                {role}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Member since</span>
              <span className="font-medium">{memberSince}</span>
            </div>
            {banned && (
              <p className="text-destructive text-sm">
                This account is banned.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Reset your password</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default SettingsTabs;
