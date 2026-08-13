import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignUpForm from "@/components/auth/SignUpForm";
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
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center justify-items-center text-center">
          <CardTitle className="text-lg">Create account</CardTitle>
          <CardDescription>Join Unboxd to start shopping.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
