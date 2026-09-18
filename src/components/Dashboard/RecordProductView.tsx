"use client";

import { useEffect } from "react";
import { recordProductView } from "@/lib/recentlyViewed";

const RecordProductView = ({ productId }: { productId: string }) => {
  useEffect(() => {
    recordProductView(productId);
  }, [productId]);
  return null;
};

export default RecordProductView;
