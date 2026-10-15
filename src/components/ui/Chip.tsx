import type { ReactNode } from "react";

/**
 * A small piece of metadata — a technology, a location, a status.
 *
 * Chips never carry meaning through colour alone: an `accent` chip is tinted
 * *and* usually paired with an icon or a word by the caller.
 */

export type ChipTone = "neutral" | "accent" | "violet" | "outline";

const TONES: Record<ChipTone, string> = {
  neutral: "border-line bg-panel text-muted",
  accent:
    "border-transparent bg-[color-mix(in_oklab,var(--c-teal)_14%,transparent)] text-teal",
  violet:
    "border-transparent bg-[color-mix(in_oklab,var(--c-violet)_16%,transparent)] text-violet",
  outline: "border-line-strong bg-transparent text-muted",
};

export interface ChipProps {
  children: ReactNode;
  icon?: ReactNode;
  tone?: ChipTone;
  className?: string;
}

export function Chip({ children, icon, tone = "neutral", className = "" }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none ${TONES[tone]} ${className}`}
    >
      {icon ? (
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
