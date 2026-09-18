"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/shadcnui/button";
import { toast } from "@/components/shadcnui/toast";

const CopyAddressButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.add({ title: "Address copied", type: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.add({ title: "Could not copy address", type: "error" });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      aria-label={copied ? "Address copied" : "Copy address"}
      data-print-hidden>
      {copied ?
        <CheckIcon aria-hidden="true" />
      : <CopyIcon aria-hidden="true" />}
    </Button>
  );
};

export default CopyAddressButton;
