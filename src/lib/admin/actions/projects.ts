"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { touchContent } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { describePrismaError } from "@/lib/admin/errors";
import { slugify } from "@/lib/admin/format";
import {
  fail,
  featuredSchema,
  fieldError,
  idSchema,
  publishSchema,
  projectSchema,
  zodFail,
} from "@/lib/admin/schemas";
import { isManagedMediaUrl } from "@/lib/media/storage";
import type { ActionResult, ProjectInput } from "@/lib/admin/types";

/**
 * Project mutations, including the cover image and the gallery.
 *
 * The gallery is saved as a replace-all inside the same transaction as the
 * project row: the client owns the whole ordered list, so "delete the ones that
 * are no longer in the list" is the whole update rule and there is no way to end
 * up with a half-reordered gallery.
 */

const LIST_PATH = "/admin/projects";

function validateMediaPaths(data: {
  coverPath: string | null;
  images: { path: string; alt: string }[];
}): ActionResult<never> | null {
  if (data.coverPath && !isManagedMediaUrl(data.coverPath)) {
    return fieldError("The cover must be an image uploaded through this panel.", "coverPath");
  }

  for (const image of data.images) {
    if (!isManagedMediaUrl(image.path)) {
      return fieldError("Every gallery image must be uploaded through this panel.", "images");
    }
  }

  return null;
}

export async function saveProject(
  input: ProjectInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;
  const slug = slugify(data.slug.length > 0 ? data.slug : data.title);
  if (slug.length === 0) {
    return fieldError("Could not build a slug from that title — type one in manually.", "slug");
  }

  const mediaProblem = validateMediaPaths(data);
  if (mediaProblem) return mediaProblem;

  const clash = await prisma.project.findFirst({
    where: { slug, ...(data.id ? { NOT: { id: data.id } } : {}) },
    select: { id: true },
  });
  if (clash) return fieldError("Another project already uses that slug.", "slug");

  const payload = {
    slug,
    title: data.title,
    summary: data.summary,
    body: data.body,
    role: data.role,
    client: data.client,
    year: data.year,
    liveUrl: data.liveUrl,
    repoUrl: data.repoUrl,
    techStack: data.techStack,
    coverPath: data.coverPath,
    featured: data.featured,
    order: data.order,
    isPublished: data.isPublished,
    shareText: data.shareText,
  };

  try {
    const saved = await prisma.$transaction(async (tx) => {
      const project = data.id
        ? await tx.project.update({ where: { id: data.id }, data: payload })
        : await tx.project.create({ data: payload });

      await tx.projectImage.deleteMany({ where: { projectId: project.id } });

      if (data.images.length > 0) {
        await tx.projectImage.createMany({
          data: data.images.map((image, index) => ({
            projectId: project.id,
            path: image.path,
            alt: image.alt,
            caption: image.caption,
            width: image.width,
            height: image.height,
            order: index,
          })),
        });
      }

      return project;
    });

    touchContent();
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${saved.id}`);

    return {
      ok: true,
      message: data.id ? "Project saved." : "Project created.",
      data: { id: saved.id, slug: saved.slug },
    };
  } catch (error) {
    return fail(describePrismaError(error, "The project could not be saved."));
  }
}

export async function deleteProject(id: string): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return zodFail(parsed.error, "Missing project id.");

  try {
    // Gallery rows cascade with the project (see schema.prisma).
    await prisma.project.delete({ where: { id: parsed.data } });
  } catch (error) {
    return fail(describePrismaError(error, "The project could not be deleted."));
  }

  touchContent();
  revalidatePath(LIST_PATH);

  return { ok: true, message: "Project deleted.", data: { id: parsed.data } };
}

export async function setProjectPublished(
  input: { id: string; isPublished: boolean },
): Promise<ActionResult<{ id: string; isPublished: boolean }>> {
  await requireAdmin();

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error, "Could not change the published state.");

  try {
    await prisma.project.update({
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
    message: parsed.data.isPublished ? "Project published." : "Project unpublished.",
    data: { id: parsed.data.id, isPublished: parsed.data.isPublished },
  };
}

export async function setProjectFeatured(
  input: { id: string; featured: boolean },
): Promise<ActionResult<{ id: string; featured: boolean }>> {
  await requireAdmin();

  const parsed = featuredSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error, "Could not change the featured state.");

  try {
    await prisma.project.update({
      where: { id: parsed.data.id },
      data: { featured: parsed.data.featured },
    });
  } catch (error) {
    return fail(describePrismaError(error, "Could not change the featured state."));
  }

  touchContent();
  revalidatePath(LIST_PATH);

  return {
    ok: true,
    message: parsed.data.featured ? "Project marked as featured." : "Project removed from featured.",
    data: { id: parsed.data.id, featured: parsed.data.featured },
  };
}
