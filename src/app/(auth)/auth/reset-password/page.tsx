import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "@/components/Auth/ResetPasswordForm";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your Unboxd account.",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

const ResetPasswordPage = async ({ searchParams }: ResetPasswordPageProps) => {
  const { token, error } = await searchParams;

  if (error) {
    return (
      <Card className="w-full max-w-md border-white/[0.08] bg-[rgba(255,255,255,0.03)] backdrop-blur-xl">
        <CardHeader className="items-center justify-items-center text-center">
          <CardTitle className="text-lg">Reset link invalid</CardTitle>
          <CardDescription>
            {error === "INVALID_TOKEN" ?
              "This reset link is invalid or has expired. Please request a new one."
            : "Something went wrong with this reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            render={<Link href="/auth/forgot-password" />}
            nativeButton={false}>
            Request new link
          </Button>
          <Button
            variant="outline"
            render={<Link href="/auth/login" />}
            nativeButton={false}>
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md border-white/[0.08] bg-[rgba(255,255,255,0.03)] backdrop-blur-xl">
        <CardHeader className="items-center justify-items-center text-center">
          <CardTitle className="text-lg">Reset password</CardTitle>
          <CardDescription>
            No reset token found. Please use the link from your email.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            render={<Link href="/auth/forgot-password" />}
            nativeButton={false}>
            Forgot password
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-white/[0.08] bg-[rgba(255,255,255,0.03)] backdrop-blur-xl">
      <CardHeader className="items-center justify-items-center text-center">
        <CardTitle className="text-lg">Set new password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
};

export default ResetPasswordPage;
