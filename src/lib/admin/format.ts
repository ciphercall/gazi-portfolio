/**
 * Pure formatting helpers shared by admin server components and client forms.
 *
 * No React, no Prisma, no `node:*` — this file is imported from both sides of
 * the RSC boundary, so it has to stay isomorphic.
 */

/** "Senior Laravel Developer" → "senior-laravel-developer". */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** "2023-05-01" → "May 2023". Returns "" for anything unparseable. */
export function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return "";
  const [year, month] = iso.slice(0, 10).split("-");
  const monthIndex = Number(month) - 1;
  const label = MONTHS[monthIndex];
  if (!year || !label) return "";
  return `${label} ${year}`;
}

/** "May 2023 — Present" for the list views. */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  isCurrent = false,
): string {
  const from = formatMonthYear(start);
  if (isCurrent || !end) return from ? `${from} — Present` : "Present";
  const to = formatMonthYear(end);
  return from ? `${from} — ${to}` : to;
}

/** Absolute timestamp for asset panels; stable between server and client. */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
  );
}

/** Short, human "3 days ago" for the last-login line. */
export function formatRelative(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "never";
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/** Byte count for the CV asset panel. */
export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"] as const;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const label = units[unit] ?? "B";
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${label}`;
}

/** Compact first-N-characters helper for table cells. */
export function truncate(value: string, max = 120): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

/* ------------------------------------------------------------ share text --- */

export interface ShareTextSource {
  title: string;
  company?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  summary?: string | null;
  bullets?: string[];
  tags?: string[];
  link?: string | null;
}

/**
 * Build a first draft of the social post from the record's own content.
 *
 * Deliberately editable afterwards: the panel offers it as a starting point,
 * because a post that writes itself is never quite the sentence he wanted.
 */
export function suggestExperienceShareText(source: ShareTextSource): string {
  const parts: string[] = [];
  const company = source.company?.trim();
  const range = formatDateRange(source.startDate, source.endDate, source.isCurrent);

  const opener = company
    ? `${source.title.trim()} at ${company}${range ? ` (${range})` : ""}.`
    : `${source.title.trim()}${range ? ` (${range})` : ""}.`;
  parts.push(opener);

  const summary = source.summary?.trim();
  if (summary) parts.push(summary);

  const bullets = (source.bullets ?? []).map((b) => b.trim()).filter(Boolean);
  if (bullets.length > 0) {
    parts.push(bullets.map((b) => `• ${b}`).join("\n"));
  }

  const tags = (source.tags ?? []).map((t) => t.trim().replace(/\s+/g, "")).filter(Boolean);
  if (tags.length > 0) parts.push(tags.map((t) => `#${t}`).join(" "));

  if (source.link) parts.push(source.link);

  return parts.join("\n\n");
}

export function suggestProjectShareText(source: ShareTextSource): string {
  const parts: string[] = [];
  parts.push(source.title.trim());

  const summary = source.summary?.trim();
  if (summary) parts.push(summary);

  const tags = (source.tags ?? []).map((t) => t.trim().replace(/\s+/g, "")).filter(Boolean);
  if (tags.length > 0) parts.push(tags.map((t) => `#${t}`).join(" "));

  if (source.link) parts.push(source.link);

  return parts.join("\n\n");
}

/* ----------------------------------------------------------------- links --- */

/** Digits only, so "+880 1710-272659" becomes a wa.me-safe number. */
export function normalisePhone(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

/** Strip a leading @ so "m.me/apufirestl" is built from either "@apufirestl" or "apufirestl". */
export function normaliseHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").replace(/^https?:\/\/(www\.)?(m\.me|messenger\.com)\//i, "");
}
