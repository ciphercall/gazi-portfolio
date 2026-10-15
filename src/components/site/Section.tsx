import type { ReactNode } from "react";

/**
 * One vertical band of the site. Centralising padding here is what gives every
 * page the same generous rhythm — and keeps the page files readable.
 */

export interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Tighter spacing for bands that follow another band directly. */
  tight?: boolean;
  /** Renders the faint technical grid behind the content. */
  grid?: boolean;
}

export function Section({
  id,
  children,
  className = "",
  tight = false,
  grid = false,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`relative isolate px-4 ${
        tight ? "py-14 sm:py-16" : "py-20 sm:py-28"
      } sm:px-6 ${className}`}
    >
      {grid ? <div className="grid-overlay" aria-hidden="true" /> : null}
      <div className="relative z-10 mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}
