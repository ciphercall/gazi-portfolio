import type { NextRequest } from "next/server";

import { getProjectSummaries } from "@/lib/queries";
import { readBoolean, respondWith } from "@/app/api/v1/_shared";

/**
 * GET /api/v1/projects?featured=true&tech=Laravel
 *
 * List payloads deliberately omit `body` — the long markdown belongs to the
 * detail endpoint, and shipping it in every list response would triple the
 * bytes the mobile app downloads over a phone connection.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const featuredOnly = readBoolean(request.nextUrl.searchParams.get("featured"));
  const tech = request.nextUrl.searchParams.get("tech")?.trim() || undefined;

  return respondWith(
    async () => {
      const projects = await getProjectSummaries(
        featuredOnly || tech ? { featuredOnly, tech } : undefined,
      );
      return { projects };
    },
    {
      error: "projects_missing",
      message: "Project content is unavailable.",
    },
  );
}
