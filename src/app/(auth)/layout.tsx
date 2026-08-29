import { LayoutProps } from "@/lib/types";

const AuthLayout = ({ children }: LayoutProps) => {
  return (
    <div className="bg-background text-foreground relative flex min-h-svh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/15 absolute -top-32 left-1/2 size-[520px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-primary/10 absolute right-1/4 -bottom-32 size-[400px] rounded-full blur-3xl" />
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
