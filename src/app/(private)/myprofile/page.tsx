import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getProfileView } from "@/server/user/profile";
import { getUserAddresses } from "@/server/user/addresses";
import ProfileAccountPanel from "@/components/Account/ProfileAccountPanel";
import DangerZone from "@/components/Settings/DangerZone";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your Unboxd profile, avatar, security, and addresses.",
};

const MyProfilePage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/login");

  const profile = await getProfileView(session.user.id);
  if (!profile) redirect("/auth/login");

  const addresses = await getUserAddresses();
  const isAdmin = profile.role === "admin";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile and account
        </p>
      </div>

      {/* Merged account card, identity hero plus Security and Addresses zones */}
      <ProfileAccountPanel
        view={profile}
        initialAddresses={addresses}
      />

      {/* Danger Zone, hidden for admins, red for regular users */}
      {!isAdmin && <DangerZone />}
    </div>
  );
};

export default MyProfilePage;
