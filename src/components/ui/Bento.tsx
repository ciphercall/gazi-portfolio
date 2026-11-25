import type { ReactNode } from "react";

/**
 * Bento layout primitives.
 *
 * The public site is a 12-column board from `lg` up: every band is a set of
 * tiles with explicit spans, so the right-hand space that used to stay empty is
 * occupied by a real block instead of padding. Below `lg` the same children
 * stack (one column) and, from `sm`, pair up.
 *
 * Spans are a static map on purpose — Tailwind cannot see a class it builds from
 * a template string.
 */

const SPAN: Record<number, string> = {
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12",
};

export interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className = "" }: BentoGridProps) {
  return (
    <div
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4 ${className}`}
    >
      {children}
    </div>
  );
}

export interface BentoCardProps {
  children: ReactNode;
  /** Column span at `lg`. Defaults to 4. */
  span?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  className?: string;
  tone?: "glass" | "strong" | "plain";
  /** Adds the 2px hover lift used across the dense grids. */
  lift?: boolean;
}

const TONE: Record<NonNullable<BentoCardProps["tone"]>, string> = {
  glass: "glass",
  strong: "glass-strong",
  plain: "",
};

export function BentoCard({
  children,
  span = 4,
  className = "",
  tone = "glass",
  lift = false,
}: BentoCardProps) {
  return (
    <div
      className={`${TONE[tone]} ${lift ? "bento-lift" : ""} ${SPAN[span] ?? SPAN[4]} min-w-0 rounded-card p-4 ${className}`}
    >
      {children}
    </div>
  );
}
