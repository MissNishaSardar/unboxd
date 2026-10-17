import Link from "next/link";
import type { ReactNode } from "react";
import UnboxdLogo from "@/components/Brand/UnboxdLogo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

const AuthCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => {
  return (
    <Card
      withGradient
      className="w-full max-w-md shadow-lg">
      <CardHeader className="items-center justify-items-center text-center">
        <Link
          href="/"
          className="flex items-center gap-2">
          <UnboxdLogo size={32} />
          <span className="font-heading bg-gradient-to-b from-[#0f89c0] to-[#0b5a82] bg-clip-text text-[17px] font-semibold tracking-tight text-transparent dark:from-[#7dd3f8] dark:to-[#0ea5e9]">
            unboxd
          </span>
        </Link>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ?
          <CardDescription>{description}</CardDescription>
        : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default AuthCard;
