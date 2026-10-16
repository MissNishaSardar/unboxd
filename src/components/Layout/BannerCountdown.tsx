"use client";

/* eslint-disable react-hooks/set-state-in-effect -- mount gate needs one sync set to avoid hydration mismatch */
import { useEffect, useState } from "react";
import { TimerIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const pad = (value: number) => String(value).padStart(2, "0");

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
  const total = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const endingSoon = total < 86400;
  const finalHour = total < 3600;
  const units =
    days > 0 ?
      [
        { value: String(days), label: "days" },
        { value: pad(hours), label: "hrs" },
        { value: pad(minutes), label: "min" },
        { value: pad(seconds), label: "sec" },
      ]
    : [
        { value: pad(hours), label: "hrs" },
        { value: pad(minutes), label: "min" },
        { value: pad(seconds), label: "sec" },
      ];
  return (
    <span
      aria-hidden="true"
      suppressHydrationWarning
      className="inline-flex shrink-0 items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-xs font-medium opacity-90">
        <TimerIcon
          aria-hidden="true"
          className="size-3.5"
        />
        Ends in
      </span>
      {endingSoon && (
        <span className="shrink-0 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold tracking-wide text-black uppercase">
          Ending soon
        </span>
      )}
      {units.map((unit, index) => (
        <span
          key={unit.label}
          className="inline-flex shrink-0 items-center gap-1">
          <span
            className={cn(
              "bg-primary-foreground text-primary flex min-w-10 flex-col items-center rounded-md px-1.5 py-1 leading-none shadow-sm",
              finalHour && unit.label === "sec" && "motion-safe:animate-pulse",
            )}>
            <span className="text-sm font-extrabold tabular-nums">
              {unit.value}
            </span>
            <span className="text-[10px] font-medium tracking-wider uppercase opacity-70">
              {unit.label}
            </span>
          </span>
          {index < units.length - 1 && (
            <span className="font-extrabold opacity-70">:</span>
          )}
        </span>
      ))}
    </span>
  );
};

export default BannerCountdown;
