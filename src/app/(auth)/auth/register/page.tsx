import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignUpForm from "@/components/Auth/SignUpForm";
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
    <Card className="w-full max-w-md border-white/[0.08] bg-[rgba(255,255,255,0.03)] backdrop-blur-xl">
      <CardHeader className="items-center justify-items-center text-center">
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
