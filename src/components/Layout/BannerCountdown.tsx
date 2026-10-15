"use client";

/* eslint-disable react-hooks/set-state-in-effect -- mount gate needs one sync set to avoid hydration mismatch */
import { useEffect, useState } from "react";

const parts = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
};

const BannerCountdown = ({ endsAt }: { endsAt: string }) => {
  const target = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  if (now === null) return null;
  if (Number.isNaN(target) || target - now <= 0) return null;
  return (
    <span
      aria-hidden="true"
      suppressHydrationWarning>
      {" "}
      · Ends in {parts(target - now)}
    </span>
  );
};

export default BannerCountdown;
