import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import SignUpForm from "@/components/Auth/SignUpForm";
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
  title: "Create account",
  description: "Create your Unboxd account.",
};

const RegisterPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
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
        <CardTitle className="text-lg">Create account</CardTitle>
        <CardDescription>Join Unboxd to start shopping.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
    </Card>
  );
};

export default RegisterPage;
