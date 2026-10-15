import { prisma } from "@/lib/db";
import {
  EMPLOYMENT_TYPES,
  type CertificationRow,
  type EducationRow,
  type EmploymentTypeValue,
  type ExperienceRow,
  type ProfileRow,
  type ProjectRow,
  type SkillRow,
} from "@/lib/admin/types";

/**
 * Admin-side reads.
 *
 * The panel must show *drafts* as well as published rows, which is exactly what
 * `src/lib/queries.ts` refuses to do by design — that module is the public
 * contract. So the admin keeps its own reads here and converts every row into a
 * plain, JSON-safe object before it crosses into a client component.
 */

const isoDate = (value: Date | null): string | null =>
  value ? value.toISOString().slice(0, 10) : null;

function toEmploymentType(value: string): EmploymentTypeValue {
  return (EMPLOYMENT_TYPES as readonly string[]).includes(value)
    ? (value as EmploymentTypeValue)
    : "FULL_TIME";
}

/* ----------------------------------------------------------- experience --- */

export async function listExperiences(): Promise<ExperienceRow[]> {
  const rows = await prisma.experience.findMany({
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    company: row.company,
    companyUrl: row.companyUrl,
    employmentType: toEmploymentType(row.employmentType),
    location: row.location,
    startDate: isoDate(row.startDate) ?? "",
    endDate: isoDate(row.endDate),
    isCurrent: row.isCurrent,
    summary: row.summary,
    bullets: [...row.bullets],
    tags: [...row.tags],
    shareText: row.shareText,
    order: row.order,
    isPublished: row.isPublished,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getExperience(id: string): Promise<ExperienceRow | null> {
  const row = await prisma.experience.findUnique({ where: { id } });
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    company: row.company,
    companyUrl: row.companyUrl,
    employmentType: toEmploymentType(row.employmentType),
    location: row.location,
    startDate: isoDate(row.startDate) ?? "",
    endDate: isoDate(row.endDate),
    isCurrent: row.isCurrent,
    summary: row.summary,
    bullets: [...row.bullets],
    tags: [...row.tags],
    shareText: row.shareText,
    order: row.order,
    isPublished: row.isPublished,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Suggested next `order` value so a new row lands at the end of the list. */
export async function nextExperienceOrder(): Promise<number> {
  const last = await prisma.experience.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

/* ------------------------------------------------------------- projects --- */

export async function listProjects(): Promise<ProjectRow[]> {
  const rows = await prisma.project.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { images: { orderBy: { order: "asc" } } },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    role: row.role,
    client: row.client,
    year: row.year,
    liveUrl: row.liveUrl,
    repoUrl: row.repoUrl,
    techStack: [...row.techStack],
    coverPath: row.coverPath,
    featured: row.featured,
    order: row.order,
    isPublished: row.isPublished,
    shareText: row.shareText,
    updatedAt: row.updatedAt.toISOString(),
    images: row.images.map((image) => ({
      path: image.path,
      alt: image.alt,
      caption: image.caption,
      width: image.width,
      height: image.height,
    })),
  }));
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const row = await prisma.project.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } } },
  });
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    role: row.role,
    client: row.client,
    year: row.year,
    liveUrl: row.liveUrl,
    repoUrl: row.repoUrl,
    techStack: [...row.techStack],
    coverPath: row.coverPath,
    featured: row.featured,
    order: row.order,
    isPublished: row.isPublished,
    shareText: row.shareText,
    updatedAt: row.updatedAt.toISOString(),
    images: row.images.map((image) => ({
      path: image.path,
      alt: image.alt,
      caption: image.caption,
      width: image.width,
      height: image.height,
    })),
  };
}

export async function nextProjectOrder(): Promise<number> {
  const last = await prisma.project.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

/* -------------------------------------------------------------- profile --- */

export async function getProfileRow(): Promise<ProfileRow | null> {
  const row = await prisma.profile.findUnique({ where: { id: "profile" } });
  if (!row) return null;

  return {
    fullName: row.fullName,
    headline: row.headline,
    subheadline: row.subheadline,
    summary: row.summary,
    location: row.location,
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp,
    linkedinUrl: row.linkedinUrl,
    githubUrl: row.githubUrl,
    facebookUrl: row.facebookUrl,
    messengerUsername: row.messengerUsername,
    twitterUrl: row.twitterUrl,
    websiteUrl: row.websiteUrl,
    avatarPath: row.avatarPath,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/* --------------------------------------------------------------- lists --- */

export async function listEducations(): Promise<EducationRow[]> {
  const rows = await prisma.education.findMany({
    orderBy: [{ order: "asc" }, { endYear: "desc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    school: row.school,
    degree: row.degree,
    field: row.field,
    startYear: row.startYear,
    endYear: row.endYear,
    details: row.details,
    order: row.order,
  }));
}

export async function listSkills(): Promise<SkillRow[]> {
  const rows = await prisma.skill.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    level: row.level,
    order: row.order,
  }));
}

export async function listCertifications(): Promise<CertificationRow[]> {
  const rows = await prisma.certification.findMany({ orderBy: [{ order: "asc" }] });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    issuer: row.issuer,
    issuedOn: isoDate(row.issuedOn),
    url: row.url,
    order: row.order,
  }));
}

/* ----------------------------------------------------------- dashboard --- */

export interface DashboardCounts {
  experiences: number;
  experiencesPublished: number;
  projects: number;
  projectsPublished: number;
  skills: number;
  educations: number;
  certifications: number;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const [
    experiences,
    experiencesPublished,
    projects,
    projectsPublished,
    skills,
    educations,
    certifications,
  ] = await Promise.all([
    prisma.experience.count(),
    prisma.experience.count({ where: { isPublished: true } }),
    prisma.project.count(),
    prisma.project.count({ where: { isPublished: true } }),
    prisma.skill.count(),
    prisma.education.count(),
    prisma.certification.count(),
  ]);

  return {
    experiences,
    experiencesPublished,
    projects,
    projectsPublished,
    skills,
    educations,
    certifications,
  };
}

export async function getLastLogin(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { lastLoginAt: true },
  });
  return user?.lastLoginAt ? user.lastLoginAt.toISOString() : null;
}
