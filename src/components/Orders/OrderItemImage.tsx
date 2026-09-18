"use client";

import { useState } from "react";

const OrderItemImage = ({ src, alt }: { src: string; alt: string }) => {
  const [failed, setFailed] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed ? "/placeholder.svg" : src}
      alt={alt}
      className="size-full object-cover"
      onError={() => setFailed(true)}
    />
  );
};

export default OrderItemImage;
