"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { touchContent } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { describePrismaError } from "@/lib/admin/errors";
import { fail, fieldError, profileSchema, seoSchema, zodFail } from "@/lib/admin/schemas";
import { isManagedMediaUrl } from "@/lib/media/storage";
import type { ActionResult, ProfileInput } from "@/lib/admin/types";

/**
 * The singleton Profile row.
 *
 * Everything the public hero, the DM buttons, the OG tags and both CV variants
 * read from — which is why one save here re-queues the CV regeneration through
 * `touchContent()` rather than trying to be clever about which fields matter.
 */

const PROFILE_PATH = "/admin/profile";
const SETTINGS_PATH = "/admin/settings";
const PROFILE_ID = "profile";

export async function saveProfile(
  input: ProfileInput,
): Promise<ActionResult<{ updatedAt: string }>> {
  await requireAdmin();

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;

  if (data.avatarPath && !isManagedMediaUrl(data.avatarPath)) {
    return fieldError("The avatar must be an image uploaded through this panel.", "avatarPath");
  }

  // The Profile model stores its links as non-nullable strings with an empty
  // default, so an absent URL is "" here — never null.
  const payload = {
    fullName: data.fullName,
    headline: data.headline,
    subheadline: data.subheadline,
    summary: data.summary,
    location: data.location,
    email: data.email,
    phone: data.phone,
    whatsapp: data.whatsapp,
    linkedinUrl: data.linkedinUrl ?? "",
    githubUrl: data.githubUrl ?? "",
    facebookUrl: data.facebookUrl ?? "",
    messengerUsername: data.messengerUsername,
    twitterUrl: data.twitterUrl ?? "",
    websiteUrl: data.websiteUrl ?? "",
    avatarPath: data.avatarPath,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
  };

  try {
    const saved = await prisma.profile.upsert({
      where: { id: PROFILE_ID },
      create: { id: PROFILE_ID, ...payload },
      update: payload,
    });

    touchContent();
    revalidatePath(PROFILE_PATH);
    revalidatePath(SETTINGS_PATH);

    return {
      ok: true,
      message: "Profile saved.",
      data: { updatedAt: saved.updatedAt.toISOString() },
    };
  } catch (error) {
    return fail(describePrismaError(error, "The profile could not be saved."));
  }
}

/** Settings writes only the two SEO fields, so a typo there cannot touch the CV. */
export async function saveSeo(input: {
  seoTitle: string;
  seoDescription: string;
}): Promise<ActionResult<{ updatedAt: string }>> {
  await requireAdmin();

  const parsed = seoSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  try {
    const existing = await prisma.profile.findUnique({
      where: { id: PROFILE_ID },
      select: { id: true },
    });
    if (!existing) {
      return fail("The profile row does not exist yet — save the Profile page first.");
    }

    const saved = await prisma.profile.update({
      where: { id: PROFILE_ID },
      data: {
        seoTitle: parsed.data.seoTitle,
        seoDescription: parsed.data.seoDescription,
      },
    });

    touchContent();
    revalidatePath(SETTINGS_PATH);

    return {
      ok: true,
      message: "SEO settings saved.",
      data: { updatedAt: saved.updatedAt.toISOString() },
    };
  } catch (error) {
    return fail(describePrismaError(error, "The SEO settings could not be saved."));
  }
}
