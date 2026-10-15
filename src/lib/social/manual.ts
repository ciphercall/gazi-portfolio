import { getEnv } from "@/lib/env";

import type { SubjectType } from "@/lib/social/types";

/**
 * The manual share path — the one that works with ZERO credentials.
 *
 * Everything here is pure and server-side. The admin page calls it during render
 * and emits real `<a href>` elements, so the LinkedIn and Facebook buttons work
 * with JavaScript disabled, with no OAuth app registered, with no token key
 * configured, and with the network stack in this codebase doing nothing at all.
 * That is deliberate: it is the fallback that means social sharing still exists
 * if the OAuth side is never set up.
 *
 * It is also the honest half of the feature. No API can write into a LinkedIn
 * profile's Experience section or a Facebook profile, so the only universally
 * available way to "share an experience" is a prefilled post that the owner
 * reviews and publishes himself.
 */

/* ------------------------------------------------------------------ routes --- */

/**
 * ASSUMED PUBLIC ROUTES — CONFIRM BEFORE RELYING ON THESE.
 *
 * `src/app/(public)/**` is owned by a different agent and no route for an
 * individual experience or project exists in the tree yet, so these two shapes
 * are the best available inference: `src/lib/queries.ts` refers to "/projects",
 * so a project detail page at `/projects/<slug>` follows, and `/experience/<slug>`
 * mirrors it. They are collected here, in one place, precisely so correcting
 * them is a two-line change. The admin panel prints the resulting URL next to
 * each share block, so a wrong value is visible rather than silent.
 */
export const PUBLIC_ROUTES = {
  experience: (slug: string) => `/experience/${slug}`,
  project: (slug: string) => `/projects/${slug}`,
  /** Used when a subject has no slug to link to. */
  fallback: () => "/",
} as const;

/* ------------------------------------------------------------------- types --- */

export interface ExperienceShareSubject {
  type: "EXPERIENCE";
  id: string;
  slug: string;
  title: string;
  company: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  summary: string;
  bullets: string[];
  tags: string[];
  /** Admin-authored copy. Used verbatim when non-empty. */
  shareText: string;
  /** False when the public page is still a draft, so the link may not resolve. */
  isPublished: boolean;
}

export interface ProjectShareSubject {
  type: "PROJECT";
  id: string;
  slug: string;
  title: string;
  summary: string;
  role: string | null;
  client: string | null;
  year: number | null;
  liveUrl: string | null;
  repoUrl: string | null;
  techStack: string[];
  /** Admin-authored copy. Used verbatim when non-empty. */
  shareText: string;
  /** False when the public page is still a draft, so the link may not resolve. */
  isPublished: boolean;
}

export type ShareSubject = ExperienceShareSubject | ProjectShareSubject;

export interface ShareBundle {
  text: string;
  url: string;
  linkedin: string;
  facebook: string;
  copyText: string;
}

/* --------------------------------------------------------------- formatting --- */

/**
 * Conservative display cap.
 *
 * No provider limit is asserted here — none was verified — so this is a
 * practical one instead: the manual share links embed the whole post text in a
 * query string, and URLs stop being dependable well before a few thousand
 * characters. Anything longer than this is trimmed on a word boundary.
 */
const MAX_SHARE_TEXT_LENGTH = 1200;

/** Fixed locale and UTC so the copy is identical on every render. */
const MONTH_FORMAT = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const EMPLOYMENT_LABEL: Record<ExperienceShareSubject["employmentType"], string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

export function formatMonth(date: Date): string {
  return MONTH_FORMAT.format(date);
}

export function formatPeriod(subject: {
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
}): string {
  const start = formatMonth(subject.startDate);
  if (subject.isCurrent) return `${start} — Present`;
  if (!subject.endDate) return `${start} — Present`;
  return `${start} — ${formatMonth(subject.endDate)}`;
}

/** Collapse runs of whitespace and trim, so pasted text never arrives ragged. */
function tidy(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function clamp(value: string, max = MAX_SHARE_TEXT_LENGTH): string {
  const text = tidy(value);
  if (text.length <= max) return text;
  const clipped = text.slice(0, max);
  const lastBreak = clipped.lastIndexOf(" ");
  const body = lastBreak > max * 0.6 ? clipped.slice(0, lastBreak) : clipped;
  return `${body.trimEnd()}…`;
}

/** `#FullStack` style tag built from an arbitrary label. */
function toHashtag(label: string): string {
  const cleaned = label.replace(/[^A-Za-z0-9]+/g, "");
  return cleaned ? `#${cleaned}` : "";
}

function hashtagLine(values: readonly string[], limit = 5): string {
  const tags = values.map(toHashtag).filter(Boolean).slice(0, limit);
  return tags.join(" ");
}

/* ------------------------------------------------------------ subject copy --- */

function buildExperienceText(subject: ExperienceShareSubject): string {
  const lines: string[] = [];

  const headline = [subject.title, subject.company ? `at ${subject.company}` : ""]
    .filter(Boolean)
    .join(" ");
  lines.push(`${headline} — ${formatPeriod(subject)}`);

  const meta = [EMPLOYMENT_LABEL[subject.employmentType], subject.location]
    .filter(Boolean)
    .join(" · ");
  if (meta) lines.push(meta);

  if (subject.summary) {
    lines.push("");
    lines.push(subject.summary);
  }

  const highlights = subject.bullets.filter(Boolean).slice(0, 3);
  if (highlights.length > 0) {
    lines.push("");
    for (const bullet of highlights) lines.push(`• ${bullet}`);
  }

  const tags = hashtagLine(subject.tags);
  if (tags) {
    lines.push("");
    lines.push(tags);
  }

  return clamp(lines.join("\n"));
}

function buildProjectText(subject: ProjectShareSubject): string {
  const lines: string[] = [];

  const headlineParts = [subject.title];
  if (subject.role) headlineParts.push(`(${subject.role})`);
  if (subject.year) headlineParts.push(`· ${subject.year}`);
  lines.push(headlineParts.join(" "));

  if (subject.client) lines.push(`Built for ${subject.client}`);

  if (subject.summary) {
    lines.push("");
    lines.push(subject.summary);
  }

  if (subject.techStack.length > 0) {
    lines.push("");
    lines.push(`Stack: ${subject.techStack.slice(0, 8).join(", ")}`);
  }

  const tags = hashtagLine(subject.techStack);
  if (tags) {
    lines.push("");
    lines.push(tags);
  }

  return clamp(lines.join("\n"));
}

/**
 * Post copy for one experience or project.
 *
 * The admin-authored `shareText` field exists exactly for this, so it wins when
 * it is set; the generated copy is the fallback that makes the panel useful
 * before anything has been written by hand.
 *
 * The public URL is deliberately NOT included here. Each destination places the
 * link differently (LinkedIn appends it to the post body, Facebook takes it as a
 * `u=` parameter, the API adapters pass it as a separate `link` field), and
 * duplicating it would produce a post with the same URL twice.
 */
export function buildShareText(subject: ShareSubject): string {
  if (subject.shareText.trim()) return clamp(subject.shareText);
  return subject.type === "EXPERIENCE"
    ? buildExperienceText(subject)
    : buildProjectText(subject);
}

/**
 * Absolute public URL for a subject reference, built from `SITE_URL`.
 *
 * Takes a flat reference rather than a full subject so the publisher can build a
 * link from a dispatch row without loading every field of the content.
 */
export function publicUrlFor(input: { type: SubjectType; slug: string | null }): string {
  const base = getEnv().SITE_URL.replace(/\/+$/, "");
  const path = !input.slug
    ? PUBLIC_ROUTES.fallback()
    : input.type === "EXPERIENCE"
      ? PUBLIC_ROUTES.experience(input.slug)
      : PUBLIC_ROUTES.project(input.slug);
  return `${base}${path}`;
}

/** Absolute public URL for a subject, built from `SITE_URL`. */
export function publicUrlForSubject(subject: ShareSubject): string {
  return publicUrlFor({ type: subject.type, slug: subject.slug });
}

/* ------------------------------------------------------------------- links --- */

export interface ManualShareLinks {
  linkedin: string;
  facebook: string;
  copyText: string;
}

/**
 * The two prefilled composer links plus the plain text for the clipboard.
 *
 * Both URLs are built exactly as specified: LinkedIn takes the body text with
 * the URL appended, Facebook's sharer takes the URL as `u` and the copy as
 * `quote`. Nothing here calls an API — these are ordinary web pages the owner
 * opens, reviews and confirms himself.
 */
export function manualShareLinks(text: string, url: string): ManualShareLinks {
  const body = tidy(text);
  const copyText = [body, url].filter(Boolean).join("\n\n");

  return {
    linkedin: `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(
      `${body} ${url}`.trim(),
    )}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url,
    )}&quote=${encodeURIComponent(body)}`,
    copyText,
  };
}

/** Convenience: text, absolute URL and both links for one subject. */
export function manualShareFor(subject: ShareSubject): ShareBundle {
  const text = buildShareText(subject);
  const url = publicUrlForSubject(subject);
  const links = manualShareLinks(text, url);
  return { text, url, ...links };
}

/** Which `SocialDispatch.subjectType` a share subject maps to. */
export function subjectTypeOf(subject: ShareSubject): SubjectType {
  return subject.type;
}
