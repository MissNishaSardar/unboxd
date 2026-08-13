"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/shadcnui/button";

const Header = () => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <Link
        href="/"
        className="font-heading text-lg font-medium">
        Unboxd
      </Link>
      {isPending ?
        null
      : session ?
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}>
          Sign out
        </Button>
      : <Button
          render={<Link href="/auth/login" />}
          nativeButton={false}
          size="sm">
          Sign in
        </Button>
      }
    </header>
  );
};

export default Header;
