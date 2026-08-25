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
    <div className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className="border-border bg-card w-full max-w-md">
        <CardHeader className="items-center justify-items-center text-center">
          <CardTitle className="text-lg">Sign in</CardTitle>
          <CardDescription>Welcome back to Unboxd.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
