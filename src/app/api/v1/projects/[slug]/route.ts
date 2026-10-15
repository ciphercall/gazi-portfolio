import { getProjectBySlug } from "@/lib/queries";
import { respondWith } from "@/app/api/v1/_shared";

/**
 * GET /api/v1/projects/[slug]
 *
 * The full case study: markdown `body` and the ordered `images` array. A slug
 * that does not exist answers with a JSON 404 rather than a redirect, so the
 * client can distinguish "gone" from "temporarily unavailable".
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  return respondWith(
    async () => {
      const project = await getProjectBySlug(slug);
      if (!project) return null;
      return { project };
    },
    {
      error: "project_not_found",
      message: `No published project with the slug "${slug}".`,
    },
  );
}
