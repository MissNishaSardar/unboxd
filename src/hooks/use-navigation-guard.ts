import { useCallback, useEffect, useRef, useState } from "react";

const useNavigationGuard = (isDirty: boolean) => {
  const dirtyRef = useRef(isDirty);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const guard = useCallback((next: () => void) => {
    if (!dirtyRef.current) {
      next();
      return;
    }
    pendingActionRef.current = next;
    setIsOpen(true);
  }, []);

  const confirmLeave = useCallback(() => {
    pendingActionRef.current?.();
    pendingActionRef.current = null;
    setIsOpen(false);
  }, []);

  const cancelLeave = useCallback(() => {
    pendingActionRef.current = null;
    setIsOpen(false);
  }, []);

  return { guard, isOpen, confirmLeave, cancelLeave };
};

export default useNavigationGuard;
