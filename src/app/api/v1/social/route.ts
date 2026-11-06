import { getPostedSocialPosts } from "@/lib/queries";
import { respondWith } from "@/app/api/v1/_shared";

/**
 * GET /api/v1/social
 *
 * Published LinkedIn posts, newest first, for the companion app's Updates feed.
 * Only what is already live on LinkedIn appears here — prepared and scheduled
 * posts are admin material and stay behind the admin session.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return respondWith(
    async () => ({ posts: await getPostedSocialPosts() }),
    {
      error: "social_missing",
      message: "Published posts are unavailable.",
    },
  );
}
