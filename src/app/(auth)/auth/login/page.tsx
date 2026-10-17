import type { Metadata } from "next";
import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AuthCard from "@/components/Auth/AuthCard";
import SignInForm from "@/components/Auth/SignInForm";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Unboxd account.",
};

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    const sp = await searchParams;
    // "/" is the no-callback sentinel, matching the SignInForm client guard,
    // so admins keep the /admin fallback instead of the storefront.
    const callbackUrl =
      typeof sp.callbackUrl === "string" && sp.callbackUrl !== "/" ?
        sp.callbackUrl
      : session.user.role === "admin" ? "/admin"
      : "/";
    redirect(callbackUrl as Route);
  }

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back to Unboxd.">
      <SignInForm />
    </AuthCard>
  );
};

export default LoginPage;
