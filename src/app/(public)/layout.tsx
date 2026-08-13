import { LayoutProps } from "@/lib/types";

const PublicLayout = ({ children }: LayoutProps) => {
  return (
    <div>
      <header>Header</header>
      <main>{children}</main>
    </div>
  );
};

export default PublicLayout;
