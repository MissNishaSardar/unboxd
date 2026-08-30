"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/shadcnui/input-group";
import { cn } from "@/lib/utils";

type HeaderSearchProps = {
  className?: string;
  onNavigate?: () => void;
  autoFocus?: boolean;
};

const HeaderSearch = ({
  className,
  onNavigate,
  autoFocus,
}: HeaderSearchProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [value, setValue] = useState(initialQ);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // sync input when navigating back/forward; intentional controlled sync
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const submit = (next: string) => {
    const trimmed = next.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}` as never);
    } else {
      router.push("/search" as never);
    }
    onNavigate?.();
  };

  return (
    <form
      role="search"
      aria-label="Site search"
      className={cn("mx-auto w-full max-w-[420px] flex-1", className)}
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}>
      <InputGroup className="border-border/50 bg-background/60 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30 dark:bg-input/20 h-9 rounded-full shadow-xs backdrop-blur-sm transition-colors has-[[data-slot=input-group-control]:focus-visible]:ring-3">
        <InputGroupAddon align="inline-start">
          <SearchIcon
            aria-hidden="true"
            className="text-muted-foreground size-4"
          />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          type="search"
          placeholder="Search products..."
          aria-label="Search products"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="placeholder:text-muted-foreground/70"
        />
        <InputGroupAddon
          align="inline-end"
          className="gap-1 pr-1">
          {value.length > 0 ?
            <InputGroupButton
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label="Clear search"
              className="size-6 rounded-full"
              onClick={() => {
                setValue("");
                submit("");
                inputRef.current?.focus();
              }}>
              <XIcon aria-hidden="true" />
            </InputGroupButton>
          : <kbd className="border-border bg-muted text-muted-foreground hidden h-5 items-center gap-0.5 rounded border px-1.5 font-mono text-[11px] leading-none font-medium select-none sm:inline-flex">
              <span aria-hidden="true">⌘</span>K
            </kbd>
          }
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
};

export default HeaderSearch;
