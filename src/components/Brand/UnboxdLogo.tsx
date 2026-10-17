import { useId } from "react";
import { cn } from "@/lib/utils";

type UnboxdLogoProps = {
  className?: string;
  size?: number;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
  role?: string;
};

const UnboxdLogo = ({
  className,
  size = 48,
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel = "unboxd logo",
  role = "img",
}: UnboxdLogoProps) => {
  const rawId = useId();
  const uid = rawId.replaceAll(":", "");
  const fl = `${uid}-ubx-fl`;
  const fr = `${uid}-ubx-fr`;
  const gl = `${uid}-ubx-gl`;
  const gr = `${uid}-ubx-gr`;
  const isHidden = ariaHidden === true || ariaHidden === "true";

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={isHidden ? undefined : role}
      aria-label={isHidden ? undefined : ariaLabel}
      aria-hidden={ariaHidden}
      width={size}
      height={size}
      className={cn("shrink-0", className)}>
      <defs>
        <linearGradient
          id={fl}
          x1="0"
          y1="0"
          x2="0"
          y2="1">
          <stop
            offset="0"
            stopColor="#7dd3f8"
          />
          <stop
            offset="1"
            stopColor="#0ea5e9"
          />
        </linearGradient>
        <linearGradient
          id={fr}
          x1="0"
          y1="0"
          x2="0"
          y2="1">
          <stop
            offset="0"
            stopColor="#38bdf8"
          />
          <stop
            offset="1"
            stopColor="#0f89c0"
          />
        </linearGradient>
        <linearGradient
          id={gl}
          x1="0"
          y1="0"
          x2="0"
          y2="1">
          <stop
            offset="0"
            stopColor="#0ea5e9"
          />
          <stop
            offset="1"
            stopColor="#0b5a82"
          />
        </linearGradient>
        <linearGradient
          id={gr}
          x1="0"
          y1="0"
          x2="0"
          y2="1">
          <stop
            offset="0"
            stopColor="#0f89c0"
          />
          <stop
            offset="1"
            stopColor="#084f70"
          />
        </linearGradient>
      </defs>

      {/* dark interior (the open part) */}
      <path
        d="M24 13 L39 20.5 L24 28 L9 20.5 Z"
        fill="#0a1d2e"
        stroke="#7dd3f8"
        strokeOpacity="0.25"
      />

      {/* open flaps */}
      <path
        d="M9 20.5 L24 28 L19.5 15.5 L4.5 8 Z"
        fill={`url(#${fl})`}
      />
      <path
        d="M24 28 L39 20.5 L43.5 8 L28.5 15.5 Z"
        fill={`url(#${fr})`}
      />

      {/* box body */}
      <path
        d="M9 20.5 L24 28 L24 41 L9 33.5 Z"
        fill={`url(#${gl})`}
      />
      <path
        d="M24 28 L39 20.5 L39 33.5 L24 41 Z"
        fill={`url(#${gr})`}
      />

      {/* sparkle coming out */}
      <path
        d="M24 1.5 Q25.1 5.4 29 6.5 Q25.1 7.6 24 11.5 Q22.9 7.6 19 6.5 Q22.9 5.4 24 1.5 Z"
        fill="#e0f6ff"
      />
      <path
        d="M33.5 2 Q34 3.5 35.5 4 Q34 4.5 33.5 6 Q33 4.5 31.5 4 Q33 3.5 33.5 2 Z"
        fill="#a5dff7"
      />
      <path
        d="M14 3.5 Q14.5 5 16 5.5 Q14.5 6 14 7.5 Q13.5 6 12 5.5 Q13.5 5 14 3.5 Z"
        fill="#a5dff7"
      />
    </svg>
  );
};

export default UnboxdLogo;
