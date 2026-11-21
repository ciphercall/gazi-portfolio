import { getCvSettings } from "@/lib/settings";
import { respondWith } from "@/app/api/v1/_shared";

/**
 * GET /api/v1/cv
 *
 * What the mobile app needs to describe the two documents truthfully. The app
 * does not build either PDF — it downloads `/api/cv/designed` and `/api/cv/ats`
 * — so the only thing that can drift is the *copy* ("no images", "a photo is
 * included"). This endpoint is that copy's source.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return respondWith(
    async () => {
      const settings = await getCvSettings();

      return {
        designed: { photo: settings.designedPhoto },
        ats: { photo: settings.atsPhoto },
        notes: {
          designed: "Colour A4 sheets, page-filled at print time, with a portrait in the header band.",
          ats: settings.atsPhoto
            ? "Single column, no tables and no graphics; the profile photo is enabled."
            : "Single column, no tables, no graphics and no images for reliable parsing.",
        },
      };
    },
    {
      error: "cv_settings_unavailable",
      message: "The CV document settings could not be read.",
    },
  );
}
