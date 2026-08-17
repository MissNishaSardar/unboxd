import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

export const metadata: Metadata = {
  title: "Access denied",
  description: "You don't have permission to view this page.",
};

const ForbiddenPage = () => {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center justify-items-center text-center">
          <CardTitle className="text-lg">Access denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to view this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            render={<Link href="/" />}
            nativeButton={false}>
            Back to store
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForbiddenPage;
