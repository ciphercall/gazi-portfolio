import type { ReactNode } from "react";

import { AURORA_LINE } from "@/components/ui/aurora";

/**
 * Section header: mono eyebrow, display title, optional lead paragraph.
 * Used by every band on the site so the vertical rhythm stays identical.
 */

export interface SectionHeadingProps {
  /** Short mono kicker, e.g. "Experience". */
  eyebrow?: string;
  /** Section title. Pass ReactNode to highlight part of it in the aurora. */
  title: ReactNode;
  lead?: ReactNode;
  id?: string;
  align?: "left" | "center";
  className?: string;
  /** Heading level — index pages use h1, bands inside a page use h2/h3. */
  as?: "h1" | "h2" | "h3";
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  id,
  align = "left",
  className = "",
  as: Heading = "h2",
}: SectionHeadingProps) {
  const centered = align === "center";

  // Headings are used both full-width and inside the 3-column sticky rail, so
  // the block never splits into inner columns: that collapsed the rail headings
  // to one word per line.
  return (
    <div className={`${centered ? "mx-auto max-w-3xl text-center" : ""} ${className}`}>
      {eyebrow ? (
        <p
          className={`label-mono flex items-center gap-3 ${
            centered ? "justify-center" : ""
          }`}
        >
          <span
            className="hidden h-px w-8 sm:block"
            style={{ backgroundImage: AURORA_LINE }}
            aria-hidden="true"
          />
          {eyebrow}
        </p>
      ) : null}

      <Heading id={id} className="mt-2 text-title font-semibold">
        {title}
      </Heading>

      {lead ? (
        <p className="mt-2.5 max-w-[62ch] text-[13.5px] leading-relaxed text-muted">
          {lead}
        </p>
      ) : null}
    </div>
  );
}
