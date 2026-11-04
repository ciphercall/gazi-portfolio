import { formatRange } from "@/components/site/format";
import {
  TIMELINE_TYPE_LABELS,
  TIMELINE_TYPE_TOKENS,
  buildTimeline,
  type TimelineEntry,
  type TimelineVariant,
} from "@/lib/timeline";

/**
 * The career graph itself: calendar time left to right, one bar per role,
 * concurrent roles stacked into parallel lanes.
 *
 * Presentational only — no hooks, no motion — so the same markup serves the
 * public site (a server component) and the live admin preview (a client
 * component). Callers add headings, legends and reveal animation.
 */

export interface TimelineChartProps {
  entries: TimelineEntry[];
  /** `YYYY-MM-DD`; injected so server output and hydration agree. */
  today: string;
  variant?: TimelineVariant;
  /** Entry to outline — used by the admin preview for the draft being edited. */
  highlightSlug?: string | null;
  ariaLabel: string;
}

const LANE_METRICS: Record<TimelineVariant, { bar: number; gap: number }> = {
  full: { bar: 42, gap: 8 },
  compact: { bar: 30, gap: 6 },
};

/** Width threshold (percent of the axis) before a bar shows its date range. */
const RANGE_MIN_PCT = { full: 20, compact: 26 };

export function TimelineChart({
  entries,
  today,
  variant = "full",
  highlightSlug = null,
  ariaLabel,
}: TimelineChartProps) {
  const layout = buildTimeline(entries, { today, variant });
  if (layout.placed.length === 0) return null;

  const metrics = LANE_METRICS[variant];
  const canvasHeight =
    layout.laneCount * metrics.bar + Math.max(0, layout.laneCount - 1) * metrics.gap;
  const span = layout.domainEndMs - layout.domainStartMs;
  const pctOf = (ms: number) => ((ms - layout.domainStartMs) / span) * 100;
  const rangeMin = RANGE_MIN_PCT[variant];

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:thin] sm:mx-0 sm:overflow-visible sm:px-0">
      <div className="min-w-[44rem] sm:min-w-0">
        <div aria-hidden="true" className="relative h-5 border-b border-line">
          {layout.years.map((year) => {
            const left = pctOf(Date.UTC(year, 0, 1));
            return (
              <span
                key={year}
                className={`label-mono absolute top-0 whitespace-nowrap ${
                  left === 0 ? "" : "-translate-x-1/2"
                }`}
                style={{ left: `${left}%` }}
              >
                {year}
              </span>
            );
          })}
        </div>

        <div className="relative mt-3" style={{ height: canvasHeight }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {layout.years.map((year) => (
              <span
                key={year}
                className="absolute inset-y-0 w-px bg-line/50"
                style={{ left: `${pctOf(Date.UTC(year, 0, 1))}%` }}
              />
            ))}
            {layout.hasCurrent ? (
              <span
                className="absolute inset-y-0 border-l border-dashed"
                style={{
                  left: `${layout.nowPct}%`,
                  borderColor: "color-mix(in oklab, var(--c-teal) 45%, transparent)",
                }}
              />
            ) : null}
          </div>

          <ol className="relative m-0 h-full list-none p-0" aria-label={ariaLabel}>
            {layout.placed.map((item) => {
              const rangeLabel = formatRange(
                item.entry.startDate,
                item.entry.endDate,
                item.entry.isCurrent,
              );
              const typeLabel = TIMELINE_TYPE_LABELS[item.entry.employmentType];
              const highlighted = highlightSlug !== null && item.key === highlightSlug;
              const token = TIMELINE_TYPE_TOKENS[item.entry.employmentType];

              const showRange = item.widthPct >= rangeMin;

              const barStyle = item.entry.isCurrent
                ? {
                    backgroundImage:
                      "linear-gradient(100deg, var(--c-teal), var(--c-cyan))",
                    borderColor: "transparent",
                    color: "var(--c-on-accent)",
                  }
                : {
                    backgroundColor: `color-mix(in oklab, var(${token}) 16%, transparent)`,
                    borderColor: `color-mix(in oklab, var(${token}) 38%, transparent)`,
                    color: "var(--c-ink)",
                  };

              return (
                <li
                  key={item.key}
                  className="absolute"
                  style={{
                    left: `${item.leftPct}%`,
                    width: `${item.widthPct}%`,
                    top: item.lane * (metrics.bar + metrics.gap),
                    height: metrics.bar,
                  }}
                  aria-label={`${item.entry.company} — ${item.entry.title}, ${rangeLabel}, ${typeLabel}${
                    item.entry.isCurrent ? ", current role" : ""
                  }`}
                >
                  <span
                    className={`flex h-full items-center gap-1.5 overflow-hidden rounded-full border px-2.5 ${
                      item.entry.isCurrent ? "shadow-glow" : ""
                    } ${
                      highlighted
                        ? "ring-2 ring-[color-mix(in_oklab,var(--c-teal)_50%,transparent)] ring-offset-2 ring-offset-canvas"
                        : ""
                    }`}
                    style={barStyle}
                    title={`${item.entry.company} — ${item.entry.title} · ${rangeLabel} · ${typeLabel}`}
                  >
                    <span className="truncate text-xs font-medium">{item.entry.company}</span>
                    {showRange ? (
                      <span className="ml-auto shrink-0 font-mono text-[10px] opacity-75">
                        {rangeLabel}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {layout.hasCurrent ? (
          <div aria-hidden="true" className="relative mt-1 h-4">
            <span
              className={`label-mono absolute top-0 whitespace-nowrap ${
                layout.nowPct > 92
                  ? "-translate-x-full"
                  : layout.nowPct < 8
                    ? ""
                    : "-translate-x-1/2"
              }`}
              style={{ left: `${layout.nowPct}%` }}
            >
              Now
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
