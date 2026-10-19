import Link from "next/link";
import UnboxdLogo from "@/components/Brand/UnboxdLogo";

type SidebarBrandProps = {
  href: "/admin" | "/" | "/myprofile";
  subtitle?: string;
};

const SidebarBrand = ({ href, subtitle }: SidebarBrandProps) => {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <UnboxdLogo
        className="size-8 shrink-0"
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
        <span className="truncate bg-gradient-to-b from-[#0f89c0] to-[#0b5a82] bg-clip-text text-sm leading-none font-medium text-transparent dark:from-[#7dd3f8] dark:to-[#0ea5e9]">
          unboxd
        </span>
        {subtitle && (
          <span className="text-muted-foreground truncate text-xs">
            {subtitle}
          </span>
        )}
      </div>
    </Link>
  );
};

export default SidebarBrand;
