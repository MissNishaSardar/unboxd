import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns Policy",
  description: "How Unboxd handles returns, exchanges, and restocking.",
};

const page = () => {
  return (
    <div className="flex flex-col gap-6 py-8">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Returns Policy
      </h1>
      <p className="text-muted-foreground leading-relaxed">
        If something is not right, request a return from your Orders page within
        7 days. We handle RETURNED status explicitly, restock the variant
        atomically, and guide you through exchange or refund. Customer first,
        every time.
      </p>
    </div>
  );
};

export default page;
