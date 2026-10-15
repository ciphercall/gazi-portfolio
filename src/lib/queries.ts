import { prisma } from "@/lib/db";
import { contentHash } from "@/lib/crypto";

/**
 * The only module that reads portfolio content from Postgres.
 *
 * Every page, API route and PDF generator goes through here, so the shape of the
 * public contract is defined in exactly one place. Reads throw on failure rather
 * than returning empty results — a page that silently renders nothing is harder
 * to diagnose than an error boundary.
 *
 * Deliberately not wrapped in a Next cache: the database sits on the same Docker
 * network and answers in well under a millisecond, and a stale cache is a worse
 * failure than a slightly slower render. `revalidatePublic()` still runs after
 * admin writes so the client-side router cache is discarded.
 */

/* ------------------------------------------------------------------ types --- */

export interface PublicLink {
  label: string;
  href: string;
}

/** Serializable project shape used by the API, the site and the CV. */
export interface ProjectDto {
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
  images: ProjectImageDto[];
}

export interface ProjectImageDto {
  path: string;
  alt: string;
  caption: string | null;
  width: number;
  height: number;
}

export interface ExperienceDto {
  slug: string;
  title: string;
  company: string;
  companyUrl: string | null;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  location: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  summary: string;
  bullets: string[];
  tags: string[];
}

/* ---------------------------------------------------------------- profile --- */

export async function getProfile() {
  return prisma.profile.findUnique({ where: { id: "profile" } });
}

/* ------------------------------------------------------------- experience --- */

export async function getExperiences(): Promise<ExperienceDto[]> {
  const rows = await prisma.experience.findMany({
    where: { isPublished: true },
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
  });

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    company: row.company,
    companyUrl: row.companyUrl,
    employmentType: row.employmentType,
    location: row.location,
    startDate: row.startDate.toISOString().slice(0, 10),
    endDate: row.endDate ? row.endDate.toISOString().slice(0, 10) : null,
    isCurrent: row.isCurrent,
    summary: row.summary,
    bullets: row.bullets,
    tags: row.tags,
  }));
}

/** Full-time and part-time are presented as separate groups, as on the CV. */
export async function getExperiencesGrouped() {
  const all = await getExperiences();
  return {
    fullTime: all.filter((item) => item.employmentType === "FULL_TIME"),
    partTime: all.filter((item) => item.employmentType !== "FULL_TIME"),
    all,
  };
}

/* --------------------------------------------------------------- projects --- */

function toProjectDto(row: {
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
  images: { path: string; alt: string; caption: string | null; width: number; height: number }[];
}): ProjectDto {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    role: row.role,
    client: row.client,
    year: row.year,
    liveUrl: row.liveUrl,
    repoUrl: row.repoUrl,
    techStack: row.techStack,
    coverPath: row.coverPath,
    featured: row.featured,
    images: row.images.map((image) => ({
      path: image.path,
      alt: image.alt,
      caption: image.caption,
      width: image.width,
      height: image.height,
    })),
  };
}

const projectInclude = {
  images: {
    orderBy: { order: "asc" },
    select: { path: true, alt: true, caption: true, width: true, height: true },
  },
} as const;

export async function getProjects(options?: { featuredOnly?: boolean; tech?: string }) {
  const rows = await prisma.project.findMany({
    where: {
      isPublished: true,
      ...(options?.featuredOnly ? { featured: true } : {}),
      ...(options?.tech ? { techStack: { has: options.tech } } : {}),
    },
    orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    include: projectInclude,
  });

  return rows.map(toProjectDto);
}

/** List payloads omit the long body so /projects stays light. */
export async function getProjectSummaries(options?: { featuredOnly?: boolean; tech?: string }) {
  const projects = await getProjects(options);
  return projects.map(({ body: _body, ...rest }) => rest);
}

export async function getProjectBySlug(slug: string): Promise<ProjectDto | null> {
  const row = await prisma.project.findFirst({
    where: { slug, isPublished: true },
    include: projectInclude,
  });
  return row ? toProjectDto(row) : null;
}

/** Distinct technologies across published projects, for the filter row. */
export async function getProjectTech(): Promise<string[]> {
  const rows = await prisma.project.findMany({
    where: { isPublished: true },
    select: { techStack: true },
  });
  const seen = new Set<string>();
  for (const row of rows) for (const tech of row.techStack) seen.add(tech);
  return [...seen].sort((a, b) => a.localeCompare(b));
}

/* --------------------------------------------------- education and skills --- */

export async function getEducations() {
  return prisma.education.findMany({ orderBy: [{ order: "asc" }, { endYear: "desc" }] });
}

export async function getCertifications() {
  return prisma.certification.findMany({ orderBy: [{ order: "asc" }] });
}

export async function getSkills() {
  const rows = await prisma.skill.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] });
  return rows;
}

/** Skills grouped by category, preserving first-seen category order. */
export async function getSkillsGrouped(): Promise<{ category: string; items: string[] }[]> {
  const rows = await getSkills();
  const groups = new Map<string, string[]>();
  for (const row of rows) {
    const bucket = groups.get(row.category);
    if (bucket) bucket.push(row.name);
    else groups.set(row.category, [row.name]);
  }
  return [...groups.entries()].map(([category, items]) => ({ category, items }));
}

/* ------------------------------------------------------------------ CV --- */

export interface CvSource {
  profile: {
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
    avatarPath: string | null;
    websiteUrl: string;
  };
  experiences: ExperienceDto[];
  educations: {
    school: string;
    degree: string;
    field: string | null;
    startYear: number;
    endYear: number;
    details: string | null;
  }[];
  skills: { category: string; items: string[] }[];
  certifications: { name: string; issuer: string; issuedOn: string | null; url: string | null }[];
  projects: ProjectDto[];
}

/**
 * Everything both PDF variants are rendered from. Returned as plain JSON so the
 * same object can be hashed, cached and handed to Chromium untouched.
 */
export async function getCvSource(): Promise<CvSource> {
  const [profile, experiences, educations, skills, certifications, projects] = await Promise.all([
    getProfile(),
    getExperiences(),
    getEducations(),
    getSkillsGrouped(),
    getCertifications(),
    getProjects(),
  ]);

  if (!profile) {
    throw new Error("Profile row is missing — run '-Action seed' to load the CV content.");
  }

  return {
    profile: {
      fullName: profile.fullName,
      headline: profile.headline,
      subheadline: profile.subheadline,
      summary: profile.summary,
      location: profile.location,
      email: profile.email,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      facebookUrl: profile.facebookUrl,
      messengerUsername: profile.messengerUsername,
      avatarPath: profile.avatarPath,
      websiteUrl: profile.websiteUrl,
    },
    experiences,
    educations: educations.map((row) => ({
      school: row.school,
      degree: row.degree,
      field: row.field,
      startYear: row.startYear,
      endYear: row.endYear,
      details: row.details,
    })),
    skills,
    certifications: certifications.map((row) => ({
      name: row.name,
      issuer: row.issuer,
      issuedOn: row.issuedOn ? row.issuedOn.toISOString().slice(0, 10) : null,
      url: row.url,
    })),
    projects,
  };
}

/**
 * Fingerprint of every CV-relevant field. Stored alongside each generated PDF;
 * when it changes, the cached file is known to be stale.
 */
export async function getCvSourceHash(): Promise<string> {
  return contentHash(await getCvSource());
}

/* -------------------------------------------------------- generated assets --- */

export async function getGeneratedAsset(kind: "CV_DESIGNED" | "CV_ATS") {
  return prisma.generatedAsset.findUnique({ where: { kind } });
}

export async function saveGeneratedAsset(input: {
  kind: "CV_DESIGNED" | "CV_ATS";
  path: string;
  bytes: number;
  sha256: string;
  sourceHash: string;
  error?: string | null;
}) {
  const { kind, ...rest } = input;
  return prisma.generatedAsset.upsert({
    where: { kind },
    create: { kind, ...rest },
    update: { ...rest, generatedAt: new Date() },
  });
}

/* ------------------------------------------------------------- API meta --- */

/**
 * Cheap change-detection for the mobile client: one hash covering all published
 * content, so the Flutter app can skip a full refetch when nothing changed.
 */
export async function getContentHash(): Promise<string> {
  const [profile, experiences, projects, skills, educations, certifications] =
    await Promise.all([
      getProfile(),
      getExperiences(),
      getProjects(),
      getSkills(),
      getEducations(),
      getCertifications(),
    ]);

  return contentHash({ profile, experiences, projects, skills, educations, certifications });
}
