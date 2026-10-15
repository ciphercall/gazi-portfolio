import { NextResponse, type NextRequest } from "next/server";

import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isProviderSlug, PROVIDERS, slugToProvider } from "@/lib/social/types";

/**
 * Forget a connected account.
 *
 * POST only — this destroys a stored credential, so it must not be reachable by
 * following a link or by a prefetch. The admin panel sends it from a button.
 *
 * `deleteMany` is deliberate: disconnecting a provider that was never connected
 * is not an error worth an alert, and `count` still tells the caller whether
 * anything was actually removed.
 *
 * The dispatch log is left untouched. It is a record of what was published, and
 * erasing history because a token was revoked would be the wrong trade.
 *
 * Auth is enforced here rather than by middleware: this path is outside the
 * `/api/admin/**` matcher in `middleware.ts`, so `requireAdminApi()` is the real
 * boundary.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized", message: "Admin session required." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

function badRequest(message: string) {
  return NextResponse.json(
    { error: "bad_request", message },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

/** Accepts a JSON body (`{ provider }`) or a form submission (`provider=...`). */
async function readProvider(request: NextRequest): Promise<string> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const body: unknown = await request.json();
      if (body && typeof body === "object" && !Array.isArray(body)) {
        const value = (body as Record<string, unknown>).provider;
        return typeof value === "string" ? value : "";
      }
    } catch {
      return "";
    }
    return "";
  }

  try {
    const form = await request.formData();
    const value = form.get("provider");
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return unauthorized();

  const provider = await readProvider(request);
  if (!isProviderSlug(provider)) {
    return badRequest(
      `Unknown provider. Expected one of: ${PROVIDERS.map((item) => item.slug).join(", ")}.`,
    );
  }

  const removed = await prisma.socialAccount.deleteMany({
    where: { provider: slugToProvider(provider) },
  });

  return NextResponse.json(
    { ok: true, provider, removed: removed.count },
    { headers: { "Cache-Control": "no-store" } },
  );
}
