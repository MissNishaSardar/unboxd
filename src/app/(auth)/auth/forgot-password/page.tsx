import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ForgotPasswordForm from "@/components/Auth/ForgotPasswordForm";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your Unboxd account.",
};

const ForgotPasswordPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <Card className="w-full max-w-md border-white/[0.08] bg-[rgba(255,255,255,0.03)] backdrop-blur-xl">
      <CardHeader className="items-center justify-items-center text-center">
        <CardTitle className="text-lg">Forgot password</CardTitle>
        <CardDescription>
          Enter your email and we will send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordPage;
