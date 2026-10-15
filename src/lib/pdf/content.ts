import type { CvSource } from "@/lib/queries";

/**
 * The renderer-free text model shared by the ATS variant, its verification test
 * and the internal debug page.
 *
 * Kept pure on purpose — no database, no Next.js, no PDF library — so the ATS
 * renderer can be exercised from a unit test with a hand-built `CvSource`. Both
 * consumers build from the same section order below, so a heading that drifts
 * out of order cannot drift in only one of them.
 */

/**
 * The conventional headings an ATS parser is trained to recognise, in the exact
 * order they must appear. `buildAtsDocument` emits sections in this order and
 * the test asserts the order in the extracted text layer, not just the presence.
 */
export const ATS_SECTION_ORDER = [
  "Professional Summary",
  "Experience",
  "Education",
  "Skills",
  "Certifications",
  "Projects",
] as const;

export type CvSectionHeading = (typeof ATS_SECTION_ORDER)[number];

/**
 * A deliberately tiny vocabulary. Each kind gets exactly one typographic
 * treatment in every renderer, which is what keeps the ATS output predictable:
 *
 *   title  — the name of a role, school, certificate or project
 *   meta   — the facts that qualify a title: company, dates, issuer, location
 *   body   — running text: summary, education details, skill groups, technologies
 *   bullet — one fact on one line, prefixed with a plain hyphen
 */
export type CvLineKind = "title" | "meta" | "body" | "bullet";

export interface CvTextLine {
  kind: CvLineKind;
  text: string;
}

export interface CvTextSection {
  heading: CvSectionHeading;
  lines: CvTextLine[];
}

export interface CvTextDocument {
  name: string;
  headline: string;
  /** One contact fact per entry, in the order they should be read. */
  contacts: string[];
  /** Only the sections that carry content, always in `ATS_SECTION_ORDER`. */
  sections: CvTextSection[];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * "2024-10-15" → "October 2024".
 *
 * The ISO string is split by hand rather than passed through `new Date()`: a
 * date-only value parsed as UTC and formatted in a negative-offset zone lands on
 * the previous month, which would silently print "September 2024" on a CV.
 */
export function formatMonthYear(iso: string): string {
  const [year = "", month = ""] = iso.split("-");
  const index = Number.parseInt(month, 10) - 1;
  const name = MONTH_NAMES[index] ?? month;
  return `${name} ${year}`.trim();
}

/** "October 2024 to Present" / "December 2023 to April 2024". */
export function formatDateRange(
  startDate: string,
  endDate: string | null,
  isCurrent: boolean,
): string {
  const start = formatMonthYear(startDate);
  const end = isCurrent || !endDate ? "Present" : formatMonthYear(endDate);
  return `${start} to ${end}`;
}

/** Contact URLs read better to a parser as `linkedin.com/in/x` than as `https://…`. */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "");
}

function nonEmpty(values: (string | null | undefined)[]): string[] {
  return values.filter((value): value is string => Boolean(value && value.trim()));
}

/**
 * Flatten a `CvSource` into the plain, ordered text both ATS surfaces print.
 *
 * Rules that matter for parsing are applied here once, not in two renderers:
 * dates are `Month YYYY`, every bullet is a single fact, and company / title /
 * date never share a line.
 */
export function buildAtsDocument(source: CvSource): CvTextDocument {
  const { profile } = source;

  const sections: CvTextSection[] = [];

  /* ------------------------------------------------------ professional summary --- */

  const summaryLines: CvTextLine[] = [];
  if (profile.subheadline.trim()) {
    summaryLines.push({ kind: "body", text: profile.subheadline.trim() });
  }
  if (profile.summary.trim()) {
    summaryLines.push({ kind: "body", text: profile.summary.trim() });
  }
  if (summaryLines.length) {
    sections.push({ heading: "Professional Summary", lines: summaryLines });
  }

  /* ---------------------------------------------------------------- experience --- */

  const experienceLines: CvTextLine[] = [];
  for (const experience of source.experiences) {
    experienceLines.push({ kind: "title", text: experience.title });
    experienceLines.push({
      kind: "meta",
      text: nonEmpty([experience.company, experience.location]).join(", "),
    });
    experienceLines.push({
      kind: "meta",
      text: formatDateRange(experience.startDate, experience.endDate, experience.isCurrent),
    });
    if (experience.summary.trim()) {
      experienceLines.push({ kind: "body", text: experience.summary.trim() });
    }
    for (const bullet of experience.bullets) {
      if (bullet.trim()) experienceLines.push({ kind: "bullet", text: bullet.trim() });
    }
    if (experience.tags.length) {
      experienceLines.push({
        kind: "body",
        text: `Technologies: ${experience.tags.join(", ")}`,
      });
    }
  }
  if (experienceLines.length) {
    sections.push({ heading: "Experience", lines: experienceLines });
  }

  /* ----------------------------------------------------------------- education --- */

  const educationLines: CvTextLine[] = [];
  for (const education of source.educations) {
    // "B.A. (Hons) in English" with field "English" must not become
    // "...in English in English" — the field is only a suffix when the degree
    // name does not already carry it.
    const degree =
      education.field && !education.degree.toLowerCase().includes(education.field.toLowerCase())
        ? `${education.degree} in ${education.field}`
        : education.degree;
    educationLines.push({ kind: "title", text: degree });
    educationLines.push({ kind: "meta", text: education.school });
    educationLines.push({
      kind: "meta",
      text: `${education.startYear} to ${education.endYear}`,
    });
    if (education.details?.trim()) {
      educationLines.push({ kind: "body", text: education.details.trim() });
    }
  }
  if (educationLines.length) {
    sections.push({ heading: "Education", lines: educationLines });
  }

  /* -------------------------------------------------------------------- skills --- */

  const skillLines: CvTextLine[] = source.skills
    .filter((group) => group.items.length > 0)
    .map((group) => ({
      kind: "body" as const,
      text: `${group.category}: ${group.items.join(", ")}`,
    }));
  if (skillLines.length) {
    sections.push({ heading: "Skills", lines: skillLines });
  }

  /* ----------------------------------------------------------- certifications --- */

  const certificationLines: CvTextLine[] = [];
  for (const certification of source.certifications) {
    certificationLines.push({ kind: "title", text: certification.name });
    certificationLines.push({ kind: "meta", text: certification.issuer });
    if (certification.issuedOn) {
      certificationLines.push({
        kind: "meta",
        text: `Issued ${formatMonthYear(certification.issuedOn)}`,
      });
    }
    if (certification.url) {
      certificationLines.push({ kind: "meta", text: displayUrl(certification.url) });
    }
  }
  if (certificationLines.length) {
    sections.push({ heading: "Certifications", lines: certificationLines });
  }

  /* ------------------------------------------------------------------ projects --- */

  const projectLines: CvTextLine[] = [];
  for (const project of source.projects) {
    projectLines.push({ kind: "title", text: project.title });
    const qualifiers = nonEmpty([
      project.role,
      project.client,
      project.year ? String(project.year) : null,
    ]);
    if (qualifiers.length) {
      projectLines.push({ kind: "meta", text: qualifiers.join(", ") });
    }
    if (project.summary.trim()) {
      projectLines.push({ kind: "body", text: project.summary.trim() });
    }
    if (project.techStack.length) {
      projectLines.push({ kind: "body", text: `Technologies: ${project.techStack.join(", ")}` });
    }
  }
  if (projectLines.length) {
    sections.push({ heading: "Projects", lines: projectLines });
  }

  return {
    name: profile.fullName,
    headline: profile.headline,
    contacts: nonEmpty([
      profile.location,
      profile.phone,
      profile.email,
      profile.linkedinUrl ? displayUrl(profile.linkedinUrl) : null,
      profile.githubUrl ? displayUrl(profile.githubUrl) : null,
      profile.websiteUrl ? displayUrl(profile.websiteUrl) : null,
    ]),
    sections,
  };
}
