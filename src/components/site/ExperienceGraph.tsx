import { CircleDot } from "lucide-react";

import { Reveal } from "@/components/site/Reveal";
import { TimelineChart } from "@/components/timeline/TimelineChart";
import {
  TIMELINE_TYPE_LABELS,
  TIMELINE_TYPE_TOKENS,
  type TimelineVariant,
} from "@/lib/timeline";
import type { ExperienceDto } from "@/lib/queries";

/**
 * The career graph as it appears on the site.
 *
 * `full` adds the legend and is the anchor of `/experience`; `compact` is the
 * homepage summary that links through to it. Both share the same chart, so the
 * lane a role sits in never changes between the two surfaces.
 */

export interface ExperienceGraphProps {
  entries: ExperienceDto[];
  variant?: TimelineVariant;
  /** `YYYY-MM-DD`; defaults to the server's UTC day. */
  today?: string;
}

export function ExperienceGraph({
  entries,
  variant = "full",
  today,
}: ExperienceGraphProps) {
  if (entries.length === 0) return null;

  const resolvedToday = today ?? new Date().toISOString().slice(0, 10);
  const presentTypes = [...new Set(entries.map((entry) => entry.employmentType))];

  return (
    <div className={variant === "full" ? "mt-10" : "mt-8"}>
      <Reveal>
        <div className="glass hairline rounded-card p-4 sm:p-5">
          <TimelineChart
            entries={entries}
            today={resolvedToday}
            variant={variant}
            ariaLabel="Career timeline: every role laid out to scale, with concurrent roles on parallel lanes."
          />

          {variant === "full" ? (
            <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
              {presentTypes.map((type) => (
                <li key={type} className="flex items-center gap-2 text-xs text-muted">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-5 shrink-0 rounded-full border"
                    style={{
                      backgroundColor: `color-mix(in oklab, var(${TIMELINE_TYPE_TOKENS[type]}) 16%, transparent)`,
                      borderColor: `color-mix(in oklab, var(${TIMELINE_TYPE_TOKENS[type]}) 38%, transparent)`,
                    }}
                  />
                  {TIMELINE_TYPE_LABELS[type]}
                </li>
              ))}
              <li className="flex items-center gap-2 text-xs text-muted">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-5 shrink-0 rounded-full"
                  style={{
                    backgroundImage: "linear-gradient(100deg, var(--c-teal), var(--c-cyan))",
                  }}
                />
                <CircleDot className="h-3.5 w-3.5 text-teal" aria-hidden="true" />
                Current role
              </li>
            </ul>
          ) : null}
        </div>
      </Reveal>

      <p className="label-mono mt-3 sm:hidden">Swipe the timeline →</p>
    </div>
  );
}
