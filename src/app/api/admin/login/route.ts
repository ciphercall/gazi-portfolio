import { NextResponse } from "next/server";
import { z } from "zod";

import { startSession, verifyCredentials } from "@/lib/auth";
import {
  checkLoginAllowed,
  clearLoginFailures,
  pruneLoginAttempts,
  recordLoginFailure,
  safeNextPath,
} from "@/lib/admin/login";

/**
 * Admin login.
 *
 * This endpoint is exempt from `middleware.ts` (it is the way *in*), so it is the
 * one admin surface that is reachable without a session — and therefore the only
 * one that has to defend itself.
 *
 * Defence here is: a body schema, a constant-time-ish credential check inside
 * `verifyCredentials()` (bcrypt against a dummy hash when the account is
 * missing, so timing does not reveal which emails exist), an in-memory attempt
 * counter, and a generic failure message that never says whether the email was
 * recognised. The rate limiter is deliberately modest — see the comment on
 * `checkLoginAllowed()` for what it does and does not protect against.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").max(320),
  password: z.string().min(1, "Enter your password.").max(200),
  next: z.string().max(500).optional(),
});

function clientAddress(request: Request): string {
  // Behind the deploy's nginx, `x-forwarded-for` is the first hop.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0];
    if (first && first.trim()) return first.trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Expected a JSON body with email and password." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, message: first?.message ?? "Email and password are both required." },
      { status: 400 },
    );
  }

  pruneLoginAttempts();

  const identifier = `${clientAddress(request)}|${parsed.data.email.toLowerCase().trim()}`;
  const gate = checkLoginAllowed(identifier);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        message: `Too many failed attempts. Try again in ${Math.ceil(gate.retryAfterSeconds / 60)} minute(s).`,
      },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } },
    );
  }

  let session;
  try {
    session = await verifyCredentials(parsed.data.email, parsed.data.password);
  } catch (error) {
    console.error("[admin] login check failed:", error);
    return NextResponse.json(
      { ok: false, message: "The sign-in service is unavailable. Check the database, then retry." },
      { status: 503 },
    );
  }

  if (!session) {
    const { blocked, remaining } = recordLoginFailure(identifier);
    return NextResponse.json(
      {
        ok: false,
        message: blocked
          ? "Too many failed attempts. This address is paused for 15 minutes."
          : remaining <= 2
            ? `Those credentials do not match an admin account. ${remaining} attempt(s) left.`
            : "Those credentials do not match an admin account.",
      },
      { status: 401 },
    );
  }

  await startSession(session);
  clearLoginFailures(identifier);

  return NextResponse.json(
    { ok: true, message: "Signed in.", redirectTo: safeNextPath(parsed.data.next) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Anything other than POST is not a login. */
export function GET(): NextResponse {
  return NextResponse.json(
    { ok: false, message: "POST an email and password to this endpoint." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
