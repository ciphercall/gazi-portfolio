"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { touchContent } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { describePrismaError } from "@/lib/admin/errors";
import { slugify } from "@/lib/admin/format";
import { experienceSchema, fail, fieldError, idSchema, publishSchema, zodFail } from "@/lib/admin/schemas";
import type { ActionResult, ExperienceInput } from "@/lib/admin/types";

/**
 * Experience mutations.
 *
 * Every action follows the same five steps: require a session, validate, write,
 * `touchContent()`, then revalidate the admin routes that display the row.
 * `touchContent()` is called exactly once per successful write — it is the only
 * thing that invalidates the public site and re-queues the CV PDFs.
 */

const LIST_PATH = "/admin/experiences";

export async function saveExperience(
  input: ExperienceInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();

  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;
  const slug = slugify(data.slug.length > 0 ? data.slug : data.title);
  if (slug.length === 0) {
    return fieldError("Could not build a slug from that title — type one in manually.", "slug");
  }

  const clash = await prisma.experience.findFirst({
    where: {
      slug,
      ...(data.id ? { NOT: { id: data.id } } : {}),
    },
    select: { id: true },
  });
  if (clash) return fieldError("Another experience already uses that slug.", "slug");

  const startDate = new Date(`${data.startDate}T00:00:00.000Z`);
  const endDate =
    data.isCurrent || !data.endDate ? null : new Date(`${data.endDate}T00:00:00.000Z`);

  if (endDate && endDate.getTime() < startDate.getTime()) {
    return fieldError("The end date cannot be before the start date.", "endDate");
  }

  const payload = {
    slug,
    title: data.title,
    company: data.company,
    companyUrl: data.companyUrl,
    employmentType: data.employmentType,
    location: data.location,
    startDate,
    endDate,
    isCurrent: data.isCurrent,
    summary: data.summary,
    bullets: data.bullets,
    tags: data.tags,
    shareText: data.shareText,
    order: data.order,
    isPublished: data.isPublished,
  };

  try {
    const saved = data.id
      ? await prisma.experience.update({ where: { id: data.id }, data: payload })
      : await prisma.experience.create({ data: payload });

    touchContent();
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${saved.id}`);

    return {
      ok: true,
      message: data.id ? "Experience saved." : "Experience created.",
      data: { id: saved.id, slug: saved.slug },
    };
  } catch (error) {
    return fail(describePrismaError(error, "The experience could not be saved."));
  }
}

export async function deleteExperience(id: string): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return zodFail(parsed.error, "Missing experience id.");

  try {
    await prisma.experience.delete({ where: { id: parsed.data } });
  } catch (error) {
    return fail(describePrismaError(error, "The experience could not be deleted."));
  }

  touchContent();
  revalidatePath(LIST_PATH);

  return { ok: true, message: "Experience deleted.", data: { id: parsed.data } };
}

export async function setExperiencePublished(
  input: { id: string; isPublished: boolean },
): Promise<ActionResult<{ id: string; isPublished: boolean }>> {
  await requireAdmin();

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error, "Could not change the published state.");

  try {
    await prisma.experience.update({
      where: { id: parsed.data.id },
      data: { isPublished: parsed.data.isPublished },
    });
  } catch (error) {
    return fail(describePrismaError(error, "Could not change the published state."));
  }

  touchContent();
  revalidatePath(LIST_PATH);

  return {
    ok: true,
    message: parsed.data.isPublished ? "Experience published." : "Experience unpublished.",
    data: { id: parsed.data.id, isPublished: parsed.data.isPublished },
  };
}
