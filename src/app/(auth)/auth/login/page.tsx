import type { Metadata } from "next";
import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignInForm from "@/components/Auth/SignInForm";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

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
    const callbackUrl =
      typeof sp.callbackUrl === "string" ? sp.callbackUrl
      : session.user.role === "admin" ? "/admin"
      : "/dashboard";
    redirect(callbackUrl as Route);
  }

  return (
    <Card className="w-full max-w-md border-white/[0.08] bg-[rgba(255,255,255,0.03)] backdrop-blur-xl">
      <CardHeader className="items-center justify-items-center text-center">
        <CardTitle className="text-lg">Sign in</CardTitle>
        <CardDescription>Welcome back to Unboxd.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
    </Card>
  );
};

export default LoginPage;
