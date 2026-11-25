"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, LayoutGrid, Tag } from "lucide-react";

/**
 * Technology filter for the project grid.
 *
 * The state lives in the URL (`?tech=Laravel`), so a filtered view is
 * shareable, crawlable and works without JavaScript. The list is dense but
 * collapsed by default — the portfolio carries ~100 technologies and rendering
 * every chip at once buried the project grid.
 */

export interface ProjectFiltersProps {
  tech: string[];
  active: string | null;
}

const COLLAPSED = 14;

export function ProjectFilters({ tech, active }: ProjectFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const base =
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition duration-300 ease-aurora";
  const inactive = "border-line-strong bg-panel text-muted hover:text-ink hover:-translate-y-0.5";
  const current =
    "border-transparent text-on-accent shadow-glow bg-[linear-gradient(100deg,var(--c-teal),var(--c-cyan)_45%,var(--c-violet))]";

  const truncated = tech.length > COLLAPSED;
  const visible = expanded ? tech : tech.slice(0, COLLAPSED);
  // An active filter must stay visible even when it sits outside the first
  // screenful of chips.
  const items = active && !visible.includes(active) ? [active, ...visible] : visible;

  return (
    <nav aria-label="Filter projects by technology">
      <p className="label-mono">Filter by technology</p>

      <ul className="mt-2 flex flex-wrap gap-1.5">
        <li>
          <Link
            href="/projects"
            aria-current={active === null ? "page" : undefined}
            className={`${base} ${active === null ? current : inactive}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            <span>All projects</span>
          </Link>
        </li>

        {items.map((item) => {
          const isActive = active === item;
          return (
            <li key={item}>
              <Link
                href={`/projects?tech=${encodeURIComponent(item)}`}
                aria-current={isActive ? "page" : undefined}
                className={`${base} ${isActive ? current : inactive}`}
              >
                <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{item}</span>
              </Link>
            </li>
          );
        })}

        {truncated ? (
          <li>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              className={`${base} border-line bg-transparent text-muted hover:text-ink`}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{expanded ? "Show fewer" : `All ${tech.length} technologies`}</span>
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
