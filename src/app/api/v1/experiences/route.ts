import { getExperiencesGrouped } from "@/lib/queries";
import { respondWith } from "@/app/api/v1/_shared";

/**
 * GET /api/v1/experiences
 *
 * `fullTime`, `partTime` and `all` in one response: the app can render the two
 * groups the CV uses without re-deriving them from employment type.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return respondWith(
    async () => {
      const grouped = await getExperiencesGrouped();
      return {
        fullTime: grouped.fullTime,
        partTime: grouped.partTime,
        all: grouped.all,
      };
    },
    {
      error: "experiences_missing",
      message: "Experience content is unavailable.",
    },
  );
}
