import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/Auth/AuthCard";
import ResetPasswordForm from "@/components/Auth/ResetPasswordForm";
import { Button } from "@/components/shadcnui/button";

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
      <AuthCard
        title="Reset link invalid"
        description={
          error === "INVALID_TOKEN" ?
            "This reset link is invalid or has expired. Please request a new one."
          : "Something went wrong with this reset link."
        }>
        <div className="flex flex-col gap-4">
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
        </div>
      </AuthCard>
    );
  }

  if (!token) {
    return (
      <AuthCard
        title="Reset password"
        description="No reset token found. Please use the link from your email.">
        <div className="flex flex-col gap-4">
          <Button
            render={<Link href="/auth/forgot-password" />}
            nativeButton={false}>
            Forgot password
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set new password"
      description="Enter your new password below.">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
};

export default ResetPasswordPage;
