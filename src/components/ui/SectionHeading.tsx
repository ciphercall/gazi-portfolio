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
  // On wide screens the lead sits beside the title instead of under it, so the
  // band uses the full shell rather than leaving its right half empty.
  const twoColumn = !centered && Boolean(lead);

  return (
    <div
      className={`${
        centered
          ? "mx-auto max-w-3xl text-center"
          : twoColumn
            ? "grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-end xl:gap-14"
            : "max-w-4xl"
      } ${className}`}
    >
      <div className={centered ? "" : "max-w-3xl"}>
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

        <Heading id={id} className="mt-3 text-title font-semibold">
          {title}
        </Heading>
      </div>

      {lead ? (
        <p
          className={`text-base leading-relaxed text-muted sm:text-lg ${
            centered ? "mt-3" : "xl:pb-1.5"
          }`}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}
