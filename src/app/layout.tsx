import type { Metadata } from "next";
import ThemeProvider from "@/components/Providers/ThemeProvider";
import { displayHeading, geistMono, geistSans } from "@/lib/fonts";
import { LayoutProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Unboxd | Electronics, Unboxed",
    template: "%s | Unboxd",
  },
  description:
    "Shop smartphones, laptops, audio, and accessories with fast COD delivery.",
};

const RootLayout = ({ children }: LayoutProps) => {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        displayHeading.variable,
      )}
      suppressHydrationWarning>
      <body>
        <NuqsAdapter>
          <ThemeProvider
            attribute={"class"}
            defaultTheme="dark"
            enableSystem={false}>
            {children}
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
};

export default RootLayout;
