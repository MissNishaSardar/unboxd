import AuthBackButton from "@/components/Auth/AuthBackButton";
import { LayoutProps } from "@/lib/types";

const AuthLayout = ({ children }: LayoutProps) => {
  return (
    <div className="relative h-dvh">
      <AuthBackButton />
      {children}
    </div>
  );
};

export default AuthLayout;
