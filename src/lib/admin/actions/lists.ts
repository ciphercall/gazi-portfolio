"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { touchContent } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { describePrismaError } from "@/lib/admin/errors";
import {
  certificationSchema,
  educationSchema,
  fail,
  fieldError,
  idSchema,
  skillSchema,
  zodFail,
} from "@/lib/admin/schemas";
import type {
  ActionResult,
  CertificationInput,
  CertificationRow,
  EducationInput,
  EducationRow,
  SkillInput,
  SkillRow,
} from "@/lib/admin/types";

/**
 * Education, Skills and Certifications.
 *
 * All three are flat lists edited inline on one page each, so they share a
 * module: the shape of the work (validate → upsert → touch → revalidate) is
 * identical and keeping them together makes the differences obvious.
 *
 * The revalidated path is the *admin* route only — the public site is handled by
 * `touchContent()`.
 */

const EDUCATION_PATH = "/admin/education";
const SKILLS_PATH = "/admin/skills";
const CERTIFICATIONS_PATH = "/admin/certifications";

/* ------------------------------------------------------------ education --- */

export async function saveEducation(
  input: EducationInput,
): Promise<ActionResult<{ row: EducationRow }>> {
  await requireAdmin();

  const parsed = educationSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;
  const payload = {
    school: data.school,
    degree: data.degree,
    field: data.field,
    startYear: data.startYear,
    endYear: data.endYear,
    details: data.details,
    order: data.order,
  };

  try {
    const saved = data.id
      ? await prisma.education.update({ where: { id: data.id }, data: payload })
      : await prisma.education.create({ data: payload });

    touchContent();
    revalidatePath(EDUCATION_PATH);

    return {
      ok: true,
      message: data.id ? "Education entry saved." : "Education entry added.",
      data: {
        row: {
          id: saved.id,
          school: saved.school,
          degree: saved.degree,
          field: saved.field,
          startYear: saved.startYear,
          endYear: saved.endYear,
          details: saved.details,
          order: saved.order,
        },
      },
    };
  } catch (error) {
    return fail(describePrismaError(error, "The education entry could not be saved."));
  }
}

export async function deleteEducation(id: string): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return zodFail(parsed.error, "Missing education id.");

  try {
    await prisma.education.delete({ where: { id: parsed.data } });
  } catch (error) {
    return fail(describePrismaError(error, "The education entry could not be deleted."));
  }

  touchContent();
  revalidatePath(EDUCATION_PATH);
  return { ok: true, message: "Education entry deleted.", data: { id: parsed.data } };
}

/* --------------------------------------------------------------- skills --- */

export async function saveSkill(
  input: SkillInput,
): Promise<ActionResult<{ row: SkillRow }>> {
  await requireAdmin();

  const parsed = skillSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;

  // `name` is unique in the schema; check it here so the failure is a field
  // error rather than a raw constraint violation.
  const clash = await prisma.skill.findFirst({
    where: {
      name: { equals: data.name, mode: "insensitive" },
      ...(data.id ? { NOT: { id: data.id } } : {}),
    },
    select: { id: true },
  });
  if (clash) return fieldError("A skill with that name already exists.", "name");

  const payload = {
    name: data.name,
    category: data.category,
    level: data.level,
    order: data.order,
  };

  try {
    const saved = data.id
      ? await prisma.skill.update({ where: { id: data.id }, data: payload })
      : await prisma.skill.create({ data: payload });

    touchContent();
    revalidatePath(SKILLS_PATH);

    return {
      ok: true,
      message: data.id ? "Skill saved." : "Skill added.",
      data: {
        row: {
          id: saved.id,
          name: saved.name,
          category: saved.category,
          level: saved.level,
          order: saved.order,
        },
      },
    };
  } catch (error) {
    return fail(describePrismaError(error, "The skill could not be saved."));
  }
}

export async function deleteSkill(id: string): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return zodFail(parsed.error, "Missing skill id.");

  try {
    await prisma.skill.delete({ where: { id: parsed.data } });
  } catch (error) {
    return fail(describePrismaError(error, "The skill could not be deleted."));
  }

  touchContent();
  revalidatePath(SKILLS_PATH);
  return { ok: true, message: "Skill deleted.", data: { id: parsed.data } };
}

/* ------------------------------------------------------- certifications --- */

export async function saveCertification(
  input: CertificationInput,
): Promise<ActionResult<{ row: CertificationRow }>> {
  await requireAdmin();

  const parsed = certificationSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;
  const payload = {
    name: data.name,
    issuer: data.issuer,
    issuedOn: data.issuedOn ? new Date(`${data.issuedOn}T00:00:00.000Z`) : null,
    url: data.url,
    order: data.order,
  };

  try {
    const saved = data.id
      ? await prisma.certification.update({ where: { id: data.id }, data: payload })
      : await prisma.certification.create({ data: payload });

    touchContent();
    revalidatePath(CERTIFICATIONS_PATH);

    return {
      ok: true,
      message: data.id ? "Certification saved." : "Certification added.",
      data: {
        row: {
          id: saved.id,
          name: saved.name,
          issuer: saved.issuer,
          issuedOn: saved.issuedOn ? saved.issuedOn.toISOString().slice(0, 10) : null,
          url: saved.url,
          order: saved.order,
        },
      },
    };
  } catch (error) {
    return fail(describePrismaError(error, "The certification could not be saved."));
  }
}

export async function deleteCertification(id: string): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return zodFail(parsed.error, "Missing certification id.");

  try {
    await prisma.certification.delete({ where: { id: parsed.data } });
  } catch (error) {
    return fail(describePrismaError(error, "The certification could not be deleted."));
  }

  touchContent();
  revalidatePath(CERTIFICATIONS_PATH);
  return { ok: true, message: "Certification deleted.", data: { id: parsed.data } };
}
