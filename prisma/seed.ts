/**
 * Seeds the portfolio from the CV dataset in `src/data/cv-seed.ts`.
 *
 * Run with:  portfolio-deploy.ps1 -Action seed
 *
 * Deliberately idempotent and non-destructive:
 *   - rows are matched on a natural key and updated, never wholesale deleted
 *   - the admin PASSWORD is only ever written on first creation, so re-seeding
 *     can never silently reset a password he changed in the panel
 *   - anything he edited in the admin panel that the seed also owns will be
 *     overwritten; anything the seed does not mention is left alone
 */

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  CERTIFICATIONS,
  EDUCATIONS,
  EXPERIENCES,
  PROFILE,
  PROJECTS,
  SKILLS,
} from "../src/data/cv-seed";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed. Run '-Action env' first.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const SITE_URL = process.env.SITE_URL ?? "http://localhost:8023";

function experienceShareText(input: {
  title: string;
  company: string;
  summary: string;
  slug: string;
}): string {
  return [
    `${input.title} at ${input.company}.`,
    "",
    input.summary,
    "",
    `Details: ${SITE_URL}/experience#${input.slug}`,
  ].join("\n");
}

function projectShareText(input: { title: string; summary: string; slug: string }): string {
  return [input.title, "", input.summary, "", `See it here: ${SITE_URL}/projects/${input.slug}`].join(
    "\n",
  );
}

/** Converts an ISO date string into a Date, or null. */
function toDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date in seed data: ${value}`);
  }
  return parsed;
}

async function seedAdmin(): Promise<string> {
  const rawEmail = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || PROFILE.fullName;

  if (!rawEmail || !password) {
    return "skipped (ADMIN_EMAIL or ADMIN_PASSWORD not set)";
  }

  const email = rawEmail.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({ where: { email }, data: { name } });
    return `kept existing ${email} (password untouched)`;
  }

  await prisma.user.create({
    data: { email, name, passwordHash: await bcrypt.hash(password, 12), role: "ADMIN" },
  });
  return `created ${email}`;
}

async function seedProfile(): Promise<void> {
  const data = {
    fullName: PROFILE.fullName,
    headline: PROFILE.headline,
    subheadline: PROFILE.subheadline,
    summary: PROFILE.summary,
    location: PROFILE.location,
    email: PROFILE.email,
    phone: PROFILE.phone,
    whatsapp: PROFILE.whatsapp,
    linkedinUrl: PROFILE.linkedinUrl,
    githubUrl: PROFILE.githubUrl,
    facebookUrl: PROFILE.facebookUrl,
    messengerUsername: PROFILE.messengerUsername,
    seoTitle: PROFILE.seoTitle,
    seoDescription: PROFILE.seoDescription,
  };

  await prisma.profile.upsert({
    where: { id: "profile" },
    create: { id: "profile", ...data },
    update: data,
  });
}

async function seedExperiences(): Promise<number> {
  let order = 0;
  for (const item of EXPERIENCES) {
    const startDate = toDate(item.startDate);
    if (!startDate) throw new Error(`Experience ${item.slug} has no start date`);

    const data = {
      title: item.title,
      company: item.company,
      companyUrl: item.companyUrl,
      employmentType: item.employmentType,
      location: item.location,
      startDate,
      endDate: toDate(item.endDate),
      isCurrent: item.isCurrent,
      summary: item.summary,
      bullets: item.bullets,
      tags: item.tags,
      shareText: experienceShareText({
        title: item.title,
        company: item.company,
        summary: item.summary,
        slug: item.slug,
      }),
      order: order++,
      isPublished: true,
    };

    await prisma.experience.upsert({
      where: { slug: item.slug },
      create: { slug: item.slug, ...data },
      update: data,
    });
  }
  return EXPERIENCES.length;
}

async function seedEducations(): Promise<number> {
  let order = 0;
  for (const item of EDUCATIONS) {
    const existing = await prisma.education.findFirst({ where: { school: item.school } });
    const data = {
      school: item.school,
      degree: item.degree,
      field: item.field,
      startYear: item.startYear,
      endYear: item.endYear,
      details: item.details,
      order: order++,
    };

    if (existing) {
      await prisma.education.update({ where: { id: existing.id }, data });
    } else {
      await prisma.education.create({ data });
    }
  }
  return EDUCATIONS.length;
}

async function seedSkills(): Promise<number> {
  let order = 0;
  for (const item of SKILLS) {
    await prisma.skill.upsert({
      where: { name: item.name },
      create: { name: item.name, category: item.category, order: order++ },
      // Category and order are owned by the seed; level is his to set in the panel.
      update: { category: item.category, order: order++ },
    });
  }
  return SKILLS.length;
}

async function seedCertifications(): Promise<number> {
  let order = 0;
  for (const item of CERTIFICATIONS) {
    const existing = await prisma.certification.findFirst({ where: { name: item.name } });
    const data = {
      name: item.name,
      issuer: item.issuer,
      issuedOn: toDate(item.issuedOn),
      url: item.url,
      order: order++,
    };

    if (existing) {
      await prisma.certification.update({ where: { id: existing.id }, data });
    } else {
      await prisma.certification.create({ data });
    }
  }
  return CERTIFICATIONS.length;
}

async function seedProjects(): Promise<number> {
  let order = 0;
  for (const item of PROJECTS) {
    const data = {
      title: item.title,
      summary: item.summary,
      body: item.body,
      role: item.role,
      client: item.client,
      year: item.year,
      liveUrl: item.liveUrl,
      repoUrl: item.repoUrl,
      techStack: item.techStack,
      featured: item.featured,
      order: order++,
      isPublished: true,
      shareText: projectShareText({
        title: item.title,
        summary: item.summary,
        slug: item.slug,
      }),
    };

    await prisma.project.upsert({
      where: { slug: item.slug },
      create: { slug: item.slug, ...data },
      update: data,
    });
  }
  return PROJECTS.length;
}

async function main(): Promise<void> {
  console.log("Seeding Gazi Portfolio from the CV dataset...\n");

  const admin = await seedAdmin();
  await seedProfile();
  const experiences = await seedExperiences();
  const educations = await seedEducations();
  const skills = await seedSkills();
  const certifications = await seedCertifications();
  const projects = await seedProjects();

  console.log(`  admin user      : ${admin}`);
  console.log(`  profile         : 1`);
  console.log(`  experiences     : ${experiences}`);
  console.log(`  education       : ${educations}`);
  console.log(`  skills          : ${skills}`);
  console.log(`  certifications  : ${certifications}`);
  console.log(`  projects        : ${projects}`);
  console.log(
    "\nNote: the two CV PDFs regenerate automatically on the next content save,\n" +
      "or on demand from /admin/cv.\n",
  );
}

main()
  .catch((error) => {
    console.error("\nSeed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
