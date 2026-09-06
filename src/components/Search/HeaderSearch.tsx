"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import SearchAutocompleteInput from "@/components/Search/SearchAutocompleteInput";

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

  useEffect(() => {
    // sync input when navigating back/forward; intentional controlled sync
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

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
    <div className={cn("mx-auto w-full max-w-[420px] flex-1", className)}>
      <SearchAutocompleteInput
        value={value}
        onValueChange={setValue}
        onSubmit={submit}
        variant="light"
        autoFocus={autoFocus}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default HeaderSearch;
