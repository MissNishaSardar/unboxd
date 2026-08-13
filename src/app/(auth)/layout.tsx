import AuthBackButton from "@/components/auth/AuthBackButton";
import { LayoutProps } from "@/lib/types";

const AuthLayout = ({ children }: LayoutProps) => {
  return (
    <div className="relative min-h-svh">
      <AuthBackButton />
      {children}
    </div>
  );
};

export default AuthLayout;
