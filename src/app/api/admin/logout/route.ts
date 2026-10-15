import { NextResponse } from "next/server";

import { endSession, getSession } from "@/lib/auth";

/**
 * Admin logout.
 *
 * Idempotent on purpose: it answers 200 whether or not there was a session, so
 * the panel's sign-out button can always finish by sending the user to the login
 * screen instead of leaving them stuck on an error.
 *
 * POST only — a GET logout is trivially CSRF-able (any `<img src="/api/admin/logout">`
 * on the internet would sign him out mid-edit).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  const session = await getSession();
  if (session) await endSession();

  return NextResponse.json(
    { ok: true, message: "Signed out." },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export function GET(): NextResponse {
  return NextResponse.json(
    { ok: false, message: "Sign-out uses POST." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
