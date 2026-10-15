import { NextResponse } from "next/server";

/**
 * Shared response plumbing for the public v1 API.
 *
 * Two rules the mobile client depends on:
 *   - a successful payload is always cacheable for a minute, with a ten-minute
 *     stale-while-revalidate window, so the Flutter app stays fast on a bad
 *     connection without ever being badly out of date;
 *   - an error is never cached, and never pretends to be content. A missing row
 *     is a 404, an unreachable database is a 503.
 */

export const API_CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=600";

export function ok<T>(data: T): NextResponse {
  return NextResponse.json(data, {
    headers: { "Cache-Control": API_CACHE_CONTROL },
  });
}

export function failure(status: number, error: string, message: string): NextResponse {
  return NextResponse.json(
    { error, message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export interface MissingResource {
  error: string;
  message: string;
}

/**
 * Runs a content loader and turns every outcome into a response:
 * payload → 200, `null` → 404, thrown error → 503.
 */
export async function respondWith<T>(
  loader: () => Promise<T | null>,
  missing: MissingResource,
): Promise<NextResponse> {
  try {
    const data = await loader();
    if (data === null) return failure(404, missing.error, missing.message);
    return ok(data);
  } catch (error) {
    console.error("[api/v1] content read failed:", error);
    return failure(
      503,
      "content_unavailable",
      "Portfolio content is temporarily unavailable. Please retry shortly.",
    );
  }
}

/** `?featured=true` / `1` / `yes` all mean the same thing. */
export function readBoolean(value: string | null): boolean {
  if (!value) return false;
  const normalised = value.trim().toLowerCase();
  return normalised === "true" || normalised === "1" || normalised === "yes";
}
