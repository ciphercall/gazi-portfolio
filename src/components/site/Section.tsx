import type { ReactNode } from "react";

/**
 * One vertical band of the site. Centralising padding here is what gives every
 * page the same compact rhythm — and keeps the page files readable.
 *
 * `rail` turns the band into the dense two-column shape used on wide screens:
 * a sticky label/metric column on the left, content on the right. The rail is
 * plain content, so it keeps working with JavaScript disabled.
 */

export interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Tighter spacing for bands that follow another band directly. */
  tight?: boolean;
  /** Renders the faint technical grid behind the content. */
  grid?: boolean;
  /** Sticky left column at xl: eyebrow, title, lead, actions. */
  rail?: ReactNode;
}

export function Section({
  id,
  children,
  className = "",
  tight = false,
  grid = false,
  rail,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`relative isolate px-4 ${
        tight ? "py-8 sm:py-10" : "py-12 sm:py-14 lg:py-16"
      } sm:px-6 lg:px-8 ${className}`}
    >
      {grid ? <div className="grid-overlay" aria-hidden="true" /> : null}
      <div className="relative z-10 mx-auto w-full max-w-[var(--shell-max)]">
        {rail ? (
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3 xl:sticky xl:top-24 xl:self-start">{rail}</div>
            <div className="min-w-0 lg:col-span-9">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
