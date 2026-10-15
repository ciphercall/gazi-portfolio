import { getSkillsGrouped } from "@/lib/queries";
import { respondWith } from "@/app/api/v1/_shared";

/**
 * GET /api/v1/skills
 *
 * Grouped by category, in first-seen order — the same grouping the website and
 * the CV use, so a new category added in the admin panel appears everywhere.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return respondWith(
    async () => {
      const groups = await getSkillsGrouped();
      return { groups };
    },
    {
      error: "skills_missing",
      message: "Skill content is unavailable.",
    },
  );
}
