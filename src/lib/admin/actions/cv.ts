"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { touchContent } from "@/lib/cache";
import { describePrismaError } from "@/lib/admin/errors";
import { cvSettingsSchema, fail, zodFail } from "@/lib/admin/schemas";
import { setCvSettings } from "@/lib/settings";
import type { ActionResult, CvSettingsInput } from "@/lib/admin/types";

/**
 * The switch behind each CV document.
 *
 * Saving is the whole workflow: the settings are part of the CV content
 * fingerprint, and `touchContent()` invalidates that fingerprint, revalidates
 * the public tree and schedules both PDFs for regeneration. So there is no
 * "apply" button and no window in which the admin panel and the download
 * disagree about whether the photo is printed.
 */

const CV_PATH = "/admin/cv";
const PUBLIC_CV_PATH = "/cv";

export async function saveCvSettings(
  input: CvSettingsInput,
): Promise<ActionResult<CvSettingsInput>> {
  await requireAdmin();

  const parsed = cvSettingsSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  try {
    const saved = await setCvSettings(parsed.data);

    touchContent();
    revalidatePath(CV_PATH);
    revalidatePath(PUBLIC_CV_PATH);

    return {
      ok: true,
      message: "CV document settings saved — both PDFs are being re-rendered.",
      data: saved,
    };
  } catch (error) {
    return fail(describePrismaError(error, "The CV settings could not be saved."));
  }
}
