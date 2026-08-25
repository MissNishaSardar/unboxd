import { CalendarIcon, MailIcon, ShieldIcon } from "lucide-react";
import { Badge } from "@/components/shadcnui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

type AccountDetailsProps = {
  email: string;
  role: string;
  memberSince: string;
  emailVerified?: boolean;
  banned?: boolean;
};

const AccountDetails = ({
  email,
  role,
  memberSince,
  emailVerified,
  banned,
}: AccountDetailsProps) => {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Account Details</CardTitle>
        <CardDescription>Read-only account information</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Email full-width row */}
        <div className="grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-4 md:p-6 md:pt-0">
          {/* Email — spans 2 cols */}
          <div className="border-border bg-muted/20 flex flex-col gap-1 border-y p-4 md:col-span-2 md:rounded-lg md:border">
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
              <MailIcon
                className="size-3.5"
                aria-hidden="true"
              />
              Email
            </span>
            <span
              className="truncate text-sm font-medium"
              title={email}>
              {email}
            </span>
            {typeof emailVerified === "boolean" && (
              <span className="mt-1">
                <Badge variant={emailVerified ? "secondary" : "outline"}>
                  {emailVerified ? "Verified" : "Not verified"}
                </Badge>
              </span>
            )}
          </div>

          {/* Role */}
          <div className="border-border bg-muted/20 flex flex-col gap-1 border-b p-4 md:rounded-lg md:border">
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
              <ShieldIcon
                className="size-3.5"
                aria-hidden="true"
              />
              Role
            </span>
            <span>
              <Badge
                variant={role === "admin" ? "default" : "secondary"}
                className="capitalize">
                {role}
              </Badge>
            </span>
          </div>

          {/* Member since */}
          <div className="bg-muted/20 border-border flex flex-col gap-1 p-4 md:rounded-lg md:border">
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
              <CalendarIcon
                className="size-3.5"
                aria-hidden="true"
              />
              Member since
            </span>
            <span className="text-sm font-medium">{memberSince}</span>
          </div>
        </div>

        {banned && (
          <p className="text-destructive px-4 pb-4 text-sm md:px-6">
            This account is banned.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountDetails;
