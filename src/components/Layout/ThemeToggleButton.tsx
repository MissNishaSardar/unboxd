"use client";

import { Button } from "@/components/shadcnui/button";
import { MoonStarIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type ThemeToggleButtonProps = {
  className?: string;
};

const ThemeToggleButton = ({ className }: ThemeToggleButtonProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn("relative", className)}>
      <SunIcon
        aria-hidden="true"
        className="size-[18px] -rotate-90 opacity-100 transition-all duration-300 dark:rotate-0 dark:opacity-0"
      />
      <MoonStarIcon
        aria-hidden="true"
        className="absolute size-[18px] -rotate-90 opacity-0 transition-all duration-300 dark:rotate-0 dark:opacity-100"
      />
    </Button>
  );
};

export default ThemeToggleButton;
