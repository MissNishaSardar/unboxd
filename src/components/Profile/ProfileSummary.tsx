import { BadgeCheckIcon, MailXIcon } from "lucide-react";
import ProfileForm from "@/components/Settings/ProfileForm";
import { Badge } from "@/components/shadcnui/badge";
import { Card, CardContent } from "@/components/shadcnui/card";
import UserStatusBadge from "@/components/Admin/UserStatusBadge";
import { formatDate } from "@/lib/format";
import type { ProfileView } from "@/server/user/profile";

type ProfileSummaryProps = {
  view: ProfileView;
  variant?: "user" | "admin";
  /** Admin only, renders the identity without the Card frame so a parent card can host it */
  bare?: boolean;
};

// Read-only admin identity, shared by the framed card and the bare slot
const AdminIdentity = ({ view }: { view: ProfileView }) => (
  <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
    <div className="bg-muted border-border flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border shadow-sm md:size-24">
      {view.image ?
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={view.image}
          alt={`${view.name} avatar`}
          width={96}
          height={96}
          className="size-full object-cover"
        />
      : <span className="text-muted-foreground text-lg font-semibold md:text-xl">
          {view.initials || "?"}
        </span>
      }
    </div>

    <div className="flex min-w-0 flex-col gap-2">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-balance md:text-xl">
        {view.name}
      </h2>

      <p className="text-muted-foreground flex flex-wrap items-center justify-center gap-1.5 text-sm sm:justify-start">
        <span
          className="truncate"
          title={view.email}>
          {view.email}
        </span>
        {view.emailVerified ?
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <BadgeCheckIcon aria-hidden="true" />
            Verified
          </Badge>
        : <Badge variant="outline">
            <MailXIcon aria-hidden="true" />
            Not verified
          </Badge>
        }
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        <Badge
          variant={view.role === "admin" ? "default" : "secondary"}
          className="capitalize">
          {view.role}
        </Badge>
        <UserStatusBadge
          banned={view.banned}
          banExpires={view.banExpires}
          deletedAt={view.deletedAt}
        />
      </div>

      <p className="text-muted-foreground text-xs">
        Member since {formatDate(view.createdAt)}
      </p>

      {view.banned && (
        <p className="text-destructive text-xs">
          Ban reason: {view.banReason ?? "No reason given"}
          {view.banExpires ?
            `, expires ${formatDate(view.banExpires)}`
          : ", permanent"}
        </p>
      )}
    </div>
  </div>
);

// One shared profile card for both shells. The user variant renders the
// identity hero bare, the account panel wraps it in the merged card. The
// admin variant hosts the read-only identity, framed by default or bare
// inside the merged management card on /admin/users/[id].
const ProfileSummary = ({
  view,
  variant = "user",
  bare = false,
}: ProfileSummaryProps) => {
  if (variant === "admin") {
    if (bare) {
      return <AdminIdentity view={view} />;
    }
    return (
      <Card
        withGradient
        className="border-border bg-card">
        <CardContent className="p-6">
          <AdminIdentity view={view} />
        </CardContent>
      </Card>
    );
  }

  // User variant, rendered bare so ProfileAccountPanel frames it
  return <ProfileForm view={view} />;
};

export default ProfileSummary;
