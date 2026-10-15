/**
 * Shared types for the admin panel.
 *
 * This module is imported by both server actions and client components, so it
 * must stay free of runtime dependencies on Prisma, `node:*` or React. The one
 * Prisma import is type-only and therefore erased at compile time.
 */

/* ------------------------------------------------------------- primitives --- */

/** Uniform result every mutating server action returns. Never throws for bad input. */
export interface ActionOk<T = undefined> {
  ok: true;
  message: string;
  data?: T;
}

export interface ActionFail {
  ok: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ActionResult<T = undefined> = ActionOk<T> | ActionFail;

/* ---------------------------------------------------------- employment --- */

export const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] as const;

export type EmploymentTypeValue = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentTypeValue, string> = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

/* ----------------------------------------------------------------- rows --- */

/** Dates cross the server/client boundary as plain ISO strings. */
export interface ExperienceRow {
  id: string;
  slug: string;
  title: string;
  company: string;
  companyUrl: string | null;
  employmentType: EmploymentTypeValue;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  summary: string;
  bullets: string[];
  tags: string[];
  shareText: string;
  order: number;
  isPublished: boolean;
  updatedAt: string;
}

export interface ProjectImageRow {
  path: string;
  alt: string;
  caption: string | null;
  width: number;
  height: number;
}

export interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  role: string | null;
  client: string | null;
  year: number | null;
  liveUrl: string | null;
  repoUrl: string | null;
  techStack: string[];
  coverPath: string | null;
  featured: boolean;
  order: number;
  isPublished: boolean;
  shareText: string;
  images: ProjectImageRow[];
  updatedAt: string;
}

export interface ProfileRow {
  fullName: string;
  headline: string;
  subheadline: string;
  summary: string;
  location: string;
  email: string;
  phone: string;
  whatsapp: string;
  linkedinUrl: string;
  githubUrl: string;
  facebookUrl: string;
  messengerUsername: string;
  twitterUrl: string;
  websiteUrl: string;
  avatarPath: string | null;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string | null;
}

export interface EducationRow {
  id: string;
  school: string;
  degree: string;
  field: string | null;
  startYear: number;
  endYear: number;
  details: string | null;
  order: number;
}

export interface SkillRow {
  id: string;
  name: string;
  category: string;
  level: number | null;
  order: number;
}

export interface CertificationRow {
  id: string;
  name: string;
  issuer: string;
  issuedOn: string | null;
  url: string | null;
  order: number;
}

/* --------------------------------------------------------------- inputs --- */

export interface ExperienceInput {
  /** `null` creates a new row; a cuid updates the existing one. */
  id: string | null;
  title: string;
  slug: string;
  company: string;
  companyUrl: string | null;
  employmentType: EmploymentTypeValue;
  location: string | null;
  /** yyyy-mm-dd */
  startDate: string;
  /** yyyy-mm-dd, or null while the role is current */
  endDate: string | null;
  isCurrent: boolean;
  summary: string;
  bullets: string[];
  tags: string[];
  shareText: string;
  order: number;
  isPublished: boolean;
}

export interface ProjectImageInput {
  path: string;
  alt: string;
  caption: string | null;
  width: number;
  height: number;
}

export interface ProjectInput {
  id: string | null;
  title: string;
  slug: string;
  summary: string;
  body: string;
  role: string | null;
  client: string | null;
  year: number | null;
  liveUrl: string | null;
  repoUrl: string | null;
  techStack: string[];
  coverPath: string | null;
  featured: boolean;
  order: number;
  isPublished: boolean;
  shareText: string;
  /** The full gallery in display order — saved as a replace-all. */
  images: ProjectImageInput[];
}

export interface ProfileInput {
  fullName: string;
  headline: string;
  subheadline: string;
  summary: string;
  location: string;
  email: string;
  phone: string;
  whatsapp: string;
  linkedinUrl: string;
  githubUrl: string;
  facebookUrl: string;
  messengerUsername: string;
  twitterUrl: string;
  websiteUrl: string;
  avatarPath: string | null;
  seoTitle: string;
  seoDescription: string;
}

export interface EducationInput {
  id: string | null;
  school: string;
  degree: string;
  field: string | null;
  startYear: number;
  endYear: number;
  details: string | null;
  order: number;
}

export interface SkillInput {
  id: string | null;
  name: string;
  category: string;
  level: number | null;
  order: number;
}

export interface CertificationInput {
  id: string | null;
  name: string;
  issuer: string;
  issuedOn: string | null;
  url: string | null;
  order: number;
}

export type ReorderModel =
  | "experience"
  | "project"
  | "education"
  | "skill"
  | "certification";

export const REORDER_MODELS: readonly ReorderModel[] = [
  "experience",
  "project",
  "education",
  "skill",
  "certification",
];

/* --------------------------------------------------------------- uploads --- */

/**
 * Mirrors `MEDIA_SUBFOLDERS` in `src/lib/media/storage.ts`.
 *
 * Declared separately so a client component can name the union without
 * importing a module that pulls in `node:fs` — the two lists are held together
 * by the upload route, which is the only thing that reads the request value.
 */
export type AdminMediaSubfolder = "projects" | "profile" | "gallery";

export const ADMIN_MEDIA_SUBFOLDERS: readonly AdminMediaSubfolder[] = [
  "projects",
  "profile",
  "gallery",
];

export interface UploadedImage {
  /** URL-relative path, e.g. `/media/projects/2026/02/<uuid>.webp`. */
  path: string;
  width: number;
  height: number;
  bytes: number;
}
