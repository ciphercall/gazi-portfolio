"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { touchContent } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { describePrismaError, describeUnknownError } from "@/lib/admin/errors";
import { slugify } from "@/lib/admin/format";
import {
  appLinkSchema,
  fail,
  fieldError,
  idSchema,
  publishSchema,
  zodFail,
} from "@/lib/admin/schemas";
import type { ActionResult, AppLinkInput } from "@/lib/admin/types";

const LIST_PATH = "/admin/app-links";

function revalidateAppLinks(id?: string): void {
  revalidatePath(LIST_PATH);
  if (id) revalidatePath(`${LIST_PATH}/${id}`);
  revalidatePath("/");
  revalidatePath("/api/v1/meta");
}

export async function saveAppLink(
  input: AppLinkInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();

  const parsed = appLinkSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;
  const slug = slugify(data.slug.length > 0 ? data.slug : data.name);
  if (slug.length === 0) {
    return fieldError("Could not build a slug from that name — type one in manually.", "slug");
  }

  const clash = await prisma.appLink.findFirst({
    where: { slug, ...(data.id ? { NOT: { id: data.id } } : {}) },
    select: { id: true },
  });
  if (clash) return fieldError("Another app link already uses that slug.", "slug");

  const payload = {
    slug,
    name: data.name,
    tagline: data.tagline,
    href: data.href,
    platform: data.platform,
    order: data.order,
    isPublished: data.isPublished,
  };

  try {
    const saved = data.id
      ? await prisma.appLink.update({ where: { id: data.id }, data: payload })
      : await prisma.appLink.create({ data: payload });

    touchContent();
    revalidateAppLinks(saved.id);

    return {
      ok: true,
      message: data.id ? "App link saved." : "App link created.",
      data: { id: saved.id, slug: saved.slug },
    };
  } catch (error) {
    return fail(describePrismaError(error, "The app link could not be saved."));
  }
}

export async function deleteAppLink(id: string): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return zodFail(parsed.error, "Missing app link id.");

  try {
    await prisma.appLink.delete({ where: { id: parsed.data } });
  } catch (error) {
    return fail(describePrismaError(error, "The app link could not be deleted."));
  }

  touchContent();
  revalidateAppLinks();

  return { ok: true, message: "App link deleted.", data: { id: parsed.data } };
}

export async function setAppLinkPublished(input: {
  id: string;
  isPublished: boolean;
}): Promise<ActionResult<{ id: string; isPublished: boolean }>> {
  await requireAdmin();

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error, "Could not change the published state.");

  try {
    await prisma.appLink.update({
      where: { id: parsed.data.id },
      data: { isPublished: parsed.data.isPublished },
    });
  } catch (error) {
    return fail(describePrismaError(error, "Could not change the published state."));
  }

  touchContent();
  revalidateAppLinks();

  return {
    ok: true,
    message: parsed.data.isPublished ? "App link published." : "App link unpublished.",
    data: { id: parsed.data.id, isPublished: parsed.data.isPublished },
  };
}

export async function moveAppLink(input: {
  id: string;
  direction: "up" | "down";
}): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = idSchema.safeParse(input.id);
  if (!parsed.success) return zodFail(parsed.error, "Missing app link id.");
  if (input.direction !== "up" && input.direction !== "down") {
    return fail("Unknown move direction.");
  }

  try {
    const rows = await prisma.appLink.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true },
    });

    const ids = rows.map((row) => row.id);
    const index = ids.indexOf(parsed.data);
    const target = index + (input.direction === "up" ? -1 : 1);

    if (index < 0) return fail("That app link no longer exists — reload the page.");
    if (target < 0 || target >= ids.length) {
      return fail("That link is already at the edge of the list.");
    }

    const [moved] = ids.splice(index, 1);
    if (moved === undefined) return fail("That app link no longer exists — reload the page.");
    ids.splice(target, 0, moved);

    await prisma.$transaction(
      ids.map((id, position) =>
        prisma.appLink.update({ where: { id }, data: { order: position } }),
      ),
    );

    touchContent();
    revalidateAppLinks();

    return { ok: true, message: "Order saved.", data: { id: parsed.data } };
  } catch (error) {
    return fail(describeUnknownError(error, "The new order could not be saved."));
  }
}
