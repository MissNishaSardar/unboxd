import type { Metadata } from "next";
import type { Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import SignInForm from "@/components/Auth/SignInForm";
import UnboxdLogo from "@/components/Brand/UnboxdLogo";
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
    <Card
      withGradient
      className="w-full max-w-md shadow-lg">
      <CardHeader className="items-center justify-items-center text-center">
        <Link
          href="/"
          className="flex items-center gap-2">
          <UnboxdLogo size={32} />
          <span className="font-heading text-[17px] font-semibold tracking-tight">
            Unboxd
          </span>
        </Link>
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
