import { ArrowRight, Building2, CalendarDays } from "lucide-react";
import Link from "next/link";

import { Chip } from "@/components/ui/Chip";
import { formatRange } from "@/components/site/format";
import type { ExperienceDto } from "@/components/site/types";

/**
 * Three compact role tiles for the home experience band. The full detail lives
 * on `/experience`; these exist so the band's right column is dense rather than
 * one wide chart floating in space.
 */
export function MiniRoleCards({ entries }: { entries: ExperienceDto[] }) {
  if (entries.length === 0) return null;

  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {entries.map((entry) => (
        <li key={entry.slug}>
          <Link
            href={`/experience#${entry.slug}`}
            className="glass bento-lift group flex h-full flex-col rounded-card p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-[13.5px] font-semibold leading-snug text-ink">
                {entry.title}
              </h3>
              {entry.isCurrent ? <Chip tone="accent">Current</Chip> : null}
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-muted">
              <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{entry.company}</span>
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-faint">
              <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{formatRange(entry.startDate, entry.endDate, entry.isCurrent)}</span>
            </p>
            <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[12px] font-medium text-teal transition group-hover:text-cyan">
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
              <span>Role detail</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
