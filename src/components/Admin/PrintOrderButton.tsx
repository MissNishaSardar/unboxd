"use client";

import { PrinterIcon } from "lucide-react";
import { Button } from "@/components/shadcnui/button";

const PrintOrderButton = () => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      data-print-hidden>
      <PrinterIcon
        data-icon="inline-start"
        aria-hidden="true"
      />
      Print invoice
    </Button>
  );
};

export default PrintOrderButton;
