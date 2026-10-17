import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AuthCard from "@/components/Auth/AuthCard";
import ForgotPasswordForm from "@/components/Auth/ForgotPasswordForm";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your Unboxd account.",
};

const ForgotPasswordPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect(session.user.role === "admin" ? "/admin" : "/");
  }

  return (
    <AuthCard
      title="Forgot password"
      description="Enter your email and we will send you a reset link.">
      <ForgotPasswordForm />
    </AuthCard>
  );
};

export default ForgotPasswordPage;
