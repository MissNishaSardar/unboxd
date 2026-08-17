"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/shadcnui/button";

const AuthBackButton = () => {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Go back"
      className="absolute top-4 left-4"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.replace("/");
        }
      }}>
      <ArrowLeftIcon aria-hidden="true" />
    </Button>
  );
};

export default AuthBackButton;
