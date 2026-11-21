import { prisma } from "@/lib/db";

/**
 * Document-level settings that change how the CV PDFs are composed.
 *
 * They live in `app_settings` rather than on `Profile` because they are
 * presentation switches, not content: the same reason `social.autoPublish` lives
 * there. The keys are dotted so the admin panel can group them without a second
 * table, and every read is one indexed lookup on a table that is already hot.
 *
 * These settings are part of the CV content fingerprint — see `getCvSourceHash`
 * — which is what makes flipping a switch regenerate both PDFs instead of
 * leaving a stale file on the volume.
 */

export const CV_SETTING_KEYS = {
  designedPhoto: "cv.designed.includePhoto",
  atsPhoto: "cv.ats.includePhoto",
} as const;

export interface CvSettings {
  /** Print the profile portrait on the designed CV. */
  designedPhoto: boolean;
  /**
   * Print the portrait on the ATS CV. Off by default: most parsers ignore images
   * and many markets treat a photo as noise, so it is opt-in rather than assumed.
   */
  atsPhoto: boolean;
}

export const CV_SETTINGS_DEFAULTS: CvSettings = {
  designedPhoto: true,
  atsPhoto: false,
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
}

/** Unset keys fall back to `CV_SETTINGS_DEFAULTS`, so the first run needs no seeding. */
export async function getCvSettings(): Promise<CvSettings> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: Object.values(CV_SETTING_KEYS) } },
    select: { key: true, value: true },
  });
  const stored = new Map(rows.map((row) => [row.key, row.value]));

  return {
    designedPhoto: parseBoolean(
      stored.get(CV_SETTING_KEYS.designedPhoto),
      CV_SETTINGS_DEFAULTS.designedPhoto,
    ),
    atsPhoto: parseBoolean(stored.get(CV_SETTING_KEYS.atsPhoto), CV_SETTINGS_DEFAULTS.atsPhoto),
  };
}

/** Upsert both keys. Returns what was written, so callers can echo the new state. */
export async function setCvSettings(next: CvSettings): Promise<CvSettings> {
  const entries: [string, boolean][] = [
    [CV_SETTING_KEYS.designedPhoto, next.designedPhoto],
    [CV_SETTING_KEYS.atsPhoto, next.atsPhoto],
  ];

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      }),
    ),
  );

  return next;
}
