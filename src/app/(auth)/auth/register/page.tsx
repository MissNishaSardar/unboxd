import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AuthCard from "@/components/Auth/AuthCard";
import SignUpForm from "@/components/Auth/SignUpForm";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Unboxd account.",
};

const RegisterPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect(session.user.role === "admin" ? "/admin" : "/");
  }

  return (
    <AuthCard
      title="Create account"
      description="Join Unboxd to start shopping.">
      <SignUpForm />
    </AuthCard>
  );
};

export default RegisterPage;
