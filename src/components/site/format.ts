/**
 * Date and copy helpers for the site.
 *
 * All date formatting is pinned to UTC and to `en-US` so the server-rendered
 * markup and the client hydration agree byte for byte — a locale-dependent
 * formatter is a classic source of hydration mismatches.
 */

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const MONTH_YEAR_DAY = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const value = iso.slice(0, 10);
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `2024-10-15` → `Oct 2024`. */
export function formatMonthYear(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? MONTH_YEAR.format(date) : "";
}

/** `2024-10-15` → `15 Oct 2024`. */
export function formatLongDate(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? MONTH_YEAR_DAY.format(date) : "";
}

/** `Oct 2024 — Present` for a current role, `Oct 2024 — Dec 2023` otherwise. */
export function formatRange(
  startIso: string | null | undefined,
  endIso?: string | null,
  isCurrent = false,
): string {
  const start = formatMonthYear(startIso);
  if (!start) return isCurrent ? "Present" : "";
  const end = isCurrent ? "Present" : formatMonthYear(endIso);
  return end ? `${start} — ${end}` : start;
}

/** Whole years between a start date and today — used for the "years of experience" stat. */
export function wholeYearsSince(iso: string | null | undefined): number {
  const start = toDate(iso);
  if (!start) return 0;
  const now = new Date();
  const days = (now.getTime() - start.getTime()) / 86_400_000;
  return Math.max(0, Math.floor(days / 365.25));
}

/** `1 → "1 year"`, `9 → "9 years"`. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Total number of skills across every group. */
export function countSkills(groups: { items: string[] }[]): number {
  return groups.reduce((total, group) => total + group.items.length, 0);
}
