import type { ReactNode } from "react";

import { AURORA_TINT } from "@/components/ui/aurora";

/**
 * The square that sits behind an icon throughout the site: glass plate, aurora
 * tint, hairline edge. It gives every icon a consistent weight so a row of them
 * reads as a designed system rather than assorted glyphs.
 */

export type IconBadgeSize = "sm" | "md" | "lg";

const SIZES: Record<IconBadgeSize, string> = {
  sm: "h-8 w-8 rounded-[10px]",
  md: "h-10 w-10 rounded-control",
  lg: "h-12 w-12 rounded-control",
};

export interface IconBadgeProps {
  children: ReactNode;
  size?: IconBadgeSize;
  className?: string;
  toneClassName?: string;
}

export function IconBadge({
  children,
  size = "md",
  className = "",
  toneClassName = "text-teal",
}: IconBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center border border-line bg-panel ${SIZES[size]} ${toneClassName} ${className}`}
      style={{ backgroundImage: AURORA_TINT }}
    >
      {children}
    </span>
  );
}
