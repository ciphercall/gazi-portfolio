import { getContentHash } from "@/lib/queries";
import { respondWith } from "@/app/api/v1/_shared";

/**
 * GET /api/v1/meta
 *
 * Change detection for the mobile client: `contentHash` covers every published
 * field, so the app can skip a full refetch when nothing has changed since the
 * last time it checked. `generatedAt` makes staleness visible when debugging.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return respondWith(
    async () => ({
      version: "v1",
      contentHash: await getContentHash(),
      generatedAt: new Date().toISOString(),
    }),
    {
      error: "meta_unavailable",
      message: "Content metadata is unavailable.",
    },
  );
}
