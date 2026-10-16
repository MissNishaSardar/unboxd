"use client";

import { useEffect, useState } from "react";
import { DEBOUNCE_MS } from "@/lib/constants";

export function useDebouncedValue<T>(value: T, delay = DEBOUNCE_MS) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
