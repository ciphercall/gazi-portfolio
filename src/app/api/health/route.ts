import { NextResponse } from "next/server";

import { databaseIsReachable } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Liveness + provenance. The compose healthcheck and `portfolio-deploy.ps1
 * -Action verify` both read this, and it reports the build stamp so a running
 * container can be traced to the revision it was built from.
 *
 * Returns 503 when the database is unreachable: an app that cannot read its own
 * content is not healthy, and saying so is more useful than a green 200.
 */
export async function GET() {
  const databaseUp = await databaseIsReachable();

  return NextResponse.json(
    {
      status: databaseUp ? "ok" : "degraded",
      service: "gazi-portfolio",
      gitSha:
        process.env.NEXT_PUBLIC_GIT_SHA || process.env.GIT_SHA || "unknown",
      database: databaseUp ? "up" : "down",
      time: new Date().toISOString(),
    },
    {
      status: databaseUp ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
