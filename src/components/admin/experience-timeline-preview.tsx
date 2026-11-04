"use client";

import { TimelineChart } from "@/components/timeline/TimelineChart";
import { formatDateRange } from "@/lib/admin/format";
import type { ExperienceInput, ExperienceRow } from "@/lib/admin/types";
import { buildTimeline, overlapSummary, type TimelineEntry } from "@/lib/timeline";

/**
 * Live timeline preview for the experience editor.
 *
 * Runs the exact lane maths the public graph uses, with the role being edited
 * highlighted, so an overlapping entry can be seen (and its consequences
 * understood) before saving. Nothing here writes to the database.
 */

const DRAFT_KEY = "__draft__";

function rowEntry(row: ExperienceRow): TimelineEntry {
  return {
    slug: row.slug,
    title: row.title,
    company: row.company,
    employmentType: row.employmentType,
    startDate: row.startDate,
    endDate: row.endDate,
    isCurrent: row.isCurrent,
  };
}

function draftEntry(draft: ExperienceInput): TimelineEntry | null {
  if (!draft.startDate) return null;

  return {
    slug: DRAFT_KEY,
    title: draft.title.trim() || "Untitled role",
    company: draft.company.trim() || "Untitled company",
    employmentType: draft.employmentType,
    startDate: draft.startDate,
    endDate: draft.isCurrent ? null : draft.endDate,
    isCurrent: draft.isCurrent,
  };
}

export function ExperienceTimelinePreview({
  siblings,
  draft,
  today,
}: {
  siblings: ExperienceRow[];
  draft: ExperienceInput;
  today: string;
}) {
  const current = draftEntry(draft);
  const entries: TimelineEntry[] = [
    ...siblings
      .filter((row) => !draft.id || row.id !== draft.id)
      .map(rowEntry),
    ...(current ? [current] : []),
  ];

  const layout = buildTimeline(entries, { today });
  const placed = layout.placed.find((item) => item.key === DRAFT_KEY);
  const overlaps = current ? overlapSummary(entries, DRAFT_KEY, { today }) : [];

  const overlapLabel =
    overlaps.length === 0
      ? "No overlap — this role sits in its own lane."
      : `Overlaps ${overlaps
          .map(
            (item) =>
              `${item.company} (${formatDateRange(item.startDate, item.endDate, item.isCurrent)})`,
          )
          .join(", ")}.`;

  return (
    <div className="flex flex-col gap-3">
      {current && placed ? (
        <div className="rounded-card border border-line bg-canvas-2/40 p-3">
          <TimelineChart
            entries={entries}
            today={today}
            variant="compact"
            highlightSlug={DRAFT_KEY}
            ariaLabel="Timeline placement preview, highlighting the role being edited."
          />
        </div>
      ) : (
        <p className="rounded-card border border-dashed border-line px-3 py-4 text-sm text-faint">
          Add a start date to see where this role lands against the others.
        </p>
      )}

      {current && placed ? (
        <p className="text-xs text-muted">
          <span className="font-mono text-[11px] text-faint">
            Lane {placed.lane + 1} of {layout.laneCount}
          </span>{" "}
          · {overlapLabel}
        </p>
      ) : null}

      <p className="text-[11px] text-faint">
        The preview follows the dates above — nothing is saved until you press Save.
      </p>
    </div>
  );
}
