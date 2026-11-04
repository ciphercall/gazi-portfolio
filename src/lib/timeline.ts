/**
 * Career-timeline geometry.
 *
 * Pure maths only — no React, no Prisma, no `node:*` — because the same layout
 * drives the public graph, the admin preview (a client component) and the
 * overlap marker on the admin list.
 *
 * Time is measured in UTC milliseconds derived from the `YYYY-MM-DD` strings the
 * data layer already speaks, so the chart renders identically on the server and
 * after hydration, and an open-ended role ends at the caller-supplied `today`.
 */

export type TimelineEmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";

export interface TimelineEntry {
  slug: string;
  title: string;
  company: string;
  employmentType: TimelineEmploymentType;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

export type TimelineVariant = "full" | "compact";

export interface PlacedEntry<T extends TimelineEntry> {
  entry: T;
  key: string;
  startMs: number;
  endMs: number;
  /** Position and width as a percentage of the domain, already inset. */
  leftPct: number;
  widthPct: number;
  lane: number;
  openEnded: boolean;
}

export interface TimelineLayout<T extends TimelineEntry> {
  placed: PlacedEntry<T>[];
  laneCount: number;
  years: number[];
  domainStartMs: number;
  domainEndMs: number;
  nowPct: number;
  hasOverlap: boolean;
  hasCurrent: boolean;
}

export interface TimelineOverlap {
  slug: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

/** A short role still has to be visible (and clickable) on the chart. */
export const TIMELINE_MIN_WIDTH_PCT = 1.4;

/** Visual breathing room between back-to-back bars sharing a lane. */
const BAR_GAP_PCT = 0.35;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}/;

export const TIMELINE_TYPE_LABELS: Record<TimelineEmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

/** CSS custom-property names, mapped to a hue per employment type. */
export const TIMELINE_TYPE_TOKENS: Record<TimelineEmploymentType, string> = {
  FULL_TIME: "--c-teal",
  PART_TIME: "--c-violet",
  CONTRACT: "--c-cyan",
  INTERNSHIP: "--c-rose",
};

interface Range {
  startMs: number;
  endMs: number;
  openEnded: boolean;
}

/** `2024-10-15` (or a longer ISO stamp) → UTC midnight. `null` when unparseable. */
export function dayToMs(value: string | null | undefined): number | null {
  if (!value || !ISO_DAY.test(value)) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  const ms = date.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function resolveRange(entry: TimelineEntry, todayMs: number): Range | null {
  const startMs = dayToMs(entry.startDate);
  if (startMs === null) return null;

  const openEnded = entry.isCurrent || !entry.endDate;
  const parsedEnd = openEnded ? todayMs : dayToMs(entry.endDate);
  const endMs = parsedEnd === null || parsedEnd < startMs ? startMs : parsedEnd;

  return { startMs, endMs, openEnded };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Places every entry on a whole-year axis and stacks overlapping roles into
 * lanes. Back-to-back roles (one ends the day the next begins) share a lane;
 * only a real date overlap opens a new one.
 */
export function buildTimeline<T extends TimelineEntry>(
  entries: T[],
  { today, variant = "full" }: { today: string; variant?: TimelineVariant },
): TimelineLayout<T> {
  const todayMs = dayToMs(today) ?? Date.now();

  const resolved = entries
    .map((entry) => {
      const range = resolveRange(entry, todayMs);
      return range ? { entry, key: entry.slug, ...range } : null;
    })
    .filter((item): item is { entry: T; key: string } & Range => item !== null)
    .sort(
      (a, b) =>
        a.startMs - b.startMs || b.endMs - a.endMs || a.key.localeCompare(b.key),
    );

  const first = resolved[0];

  if (!first) {
    const year = new Date(todayMs).getUTCFullYear();
    return {
      placed: [],
      laneCount: 0,
      years: [year],
      domainStartMs: Date.UTC(year, 0, 1),
      domainEndMs: Date.UTC(year + 1, 0, 1),
      nowPct: 100,
      hasOverlap: false,
      hasCurrent: false,
    };
  }

  let earliest = first.startMs;
  let latest = first.endMs;
  for (const item of resolved) {
    earliest = Math.min(earliest, item.startMs);
    latest = Math.max(latest, item.endMs);
  }

  const startYear = new Date(earliest).getUTCFullYear();
  const endYear = Math.max(new Date(latest).getUTCFullYear(), startYear);
  const domainStartMs = Date.UTC(startYear, 0, 1);
  const domainEndMs = Date.UTC(endYear + 1, 0, 1);
  const span = domainEndMs - domainStartMs;

  const laneEnds: number[] = [];
  const placed = resolved.map((item) => {
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= item.startMs);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endMs);
    } else {
      laneEnds[lane] = item.endMs;
    }

    const rawLeft = ((item.startMs - domainStartMs) / span) * 100;
    const rawWidth = ((item.endMs - item.startMs) / span) * 100;
    const widthPct = clamp(rawWidth - BAR_GAP_PCT, TIMELINE_MIN_WIDTH_PCT, 100);
    const leftPct = clamp(rawLeft, 0, 100 - widthPct);

    return {
      entry: item.entry,
      key: item.key,
      startMs: item.startMs,
      endMs: item.endMs,
      leftPct,
      widthPct,
      lane,
      openEnded: item.openEnded,
    };
  });

  const years: number[] = [];
  for (let year = startYear; year <= endYear; year += 1) years.push(year);

  const ticks =
    variant === "compact"
      ? years.filter(
          (year, index) =>
            index === 0 || index === years.length - 1 || (year - startYear) % 2 === 0,
        )
      : years;

  return {
    placed,
    laneCount: laneEnds.length,
    years: ticks,
    domainStartMs,
    domainEndMs,
    nowPct: clamp(((todayMs - domainStartMs) / span) * 100, 0, 100),
    hasOverlap: laneEnds.length > 1,
    hasCurrent: resolved.some((item) => item.openEnded),
  };
}

function rangesOverlap(a: Range, b: Range): boolean {
  if (a.startMs === a.endMs) return b.startMs <= a.startMs && b.endMs > a.startMs;
  if (b.startMs === b.endMs) return a.startMs <= b.startMs && a.endMs > b.startMs;
  return a.startMs < b.endMs && b.startMs < a.endMs;
}

/** Every published/draft sibling whose date range intersects `key`'s range. */
export function overlapSummary<T extends TimelineEntry>(
  entries: T[],
  key: string,
  { today }: { today: string },
): TimelineOverlap[] {
  const todayMs = dayToMs(today) ?? Date.now();
  const target = entries.find((entry) => entry.slug === key);
  if (!target) return [];

  const targetRange = resolveRange(target, todayMs);
  if (!targetRange) return [];

  const overlaps: TimelineOverlap[] = [];
  for (const entry of entries) {
    if (entry.slug === key) continue;
    const range = resolveRange(entry, todayMs);
    if (!range || !rangesOverlap(targetRange, range)) continue;
    overlaps.push({
      slug: entry.slug,
      title: entry.title,
      company: entry.company,
      startDate: entry.startDate,
      endDate: entry.endDate,
      isCurrent: entry.isCurrent,
    });
  }

  return overlaps;
}
