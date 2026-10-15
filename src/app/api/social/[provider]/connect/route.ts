import { NextResponse, type NextRequest } from "next/server";

import { requireAdminApi } from "@/lib/auth";
import { adapterForSlug } from "@/lib/social/adapters";
import { beginOAuthState, DEFAULT_RETURN_PATH, isSafeAdminReturnPath } from "@/lib/social/state";
import { isProviderSlug, PROVIDERS } from "@/lib/social/types";

/**
 * Start a provider's OAuth consent flow.
 *
 * GET is the right verb: the handler reads nothing and changes nothing on the
 * server beyond minting a short-lived state cookie, and a plain `<a>` link in the
 * admin panel is what has to reach it. The actual grant happens on the provider's
 * own domain, where the human has to approve it.
 *
 * Auth first, then the provider check, then configuration. Nothing redirects to a
 * provider before an admin session has been established, and an unconfigured
 * provider gets an actionable JSON body instead of a broken consent page.
 *
 * This route is outside the `/api/admin/**` middleware matcher, so the
 * `requireAdminApi()` call below is the real boundary and not a second opinion.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized", message: "Admin session required." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return unauthorized();

  const { provider } = await context.params;
  if (!isProviderSlug(provider)) {
    return NextResponse.json(
      {
        error: "not_found",
        message: `Unknown provider "${provider}". Expected one of: ${PROVIDERS.map((item) => item.slug).join(", ")}.`,
      },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const adapter = adapterForSlug(provider);

  // `missingConfig()` also reports SOCIAL_TOKEN_KEY: without it the callback
  // could not encrypt the token, so connecting would fail closed halfway
  // through. Better to say so before the browser leaves this site.
  const missing = adapter.missingConfig();
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "not_configured",
        provider,
        missing,
        message:
          `Social publishing for ${provider === "linkedin" ? "LinkedIn" : "Facebook"} is not configured. ` +
          `Missing environment ${missing.length === 1 ? "variable" : "variables"}: ${missing.join(", ")}. ` +
          "Add them to deploy/.env (the shapes are documented in deploy/.env.example) and restart the stack, " +
          "or use the manual share links on /admin/social, which need no credentials at all.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const returnToParam = request.nextUrl.searchParams.get("returnTo");
  const returnTo = isSafeAdminReturnPath(returnToParam) ? returnToParam : DEFAULT_RETURN_PATH;

  const started = beginOAuthState({ provider, returnTo });
  const authorizeUrl = adapter.authorizeUrl(started.state);

  // Unreachable while `missingConfig()` is empty, but `authorizeUrl()` returning
  // null is a contract on the adapter interface, so it is honoured rather than
  // assumed away: no dead redirect is ever emitted.
  if (!authorizeUrl) {
    return NextResponse.json(
      {
        error: "not_configured",
        provider,
        missing,
        message: `${provider} is not configured, so there is no consent URL to send you to.`,
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const response = NextResponse.redirect(authorizeUrl, { status: 303 });
  response.cookies.set(started.cookie);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
