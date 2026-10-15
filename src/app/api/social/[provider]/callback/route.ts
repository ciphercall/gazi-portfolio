import { NextResponse, type NextRequest } from "next/server";

import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adapterForSlug } from "@/lib/social/adapters";
import {
  clearedOAuthStateCookie,
  DEFAULT_RETURN_PATH,
  OAUTH_STATE_COOKIE,
  verifyOAuthState,
  type StateFailure,
} from "@/lib/social/state";
import { isProviderSlug, PROVIDERS, slugToProvider } from "@/lib/social/types";

/**
 * OAuth redirect target for both providers.
 *
 * Order of operations is the security contract, and it is not negotiable:
 *
 *   1. admin session          — an unauthenticated caller gets 401 JSON, never a redirect
 *   2. provider slug          — unknown providers 404 before anything else happens
 *   3. `state` verification   — signature, expiry, provider binding and the
 *                               nonce/cookie match, all before the code is touched
 *   4. code exchange          — the only step that talks to the provider
 *   5. encrypt and upsert     — `encryptSecret` inside the adapter; see below
 *   6. redirect back to admin — with a fixed, non-sensitive outcome code
 *
 * What this route never does: log, return or render a token, a client secret or
 * an authorization code. Failures leave through `?error=<code>` using codes from
 * a closed set, so a provider error string can never be reflected into the page.
 *
 * This route sits outside the `/api/admin/**` middleware matcher, so the
 * `requireAdminApi()` call is the real boundary.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized", message: "Admin session required." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

/** Stable, non-sensitive code for each way the state check can fail. */
const STATE_FAILURE_CODE: Record<StateFailure, string> = {
  state_cookie_missing: "state_missing",
  state_parameter_missing: "state_missing",
  state_malformed: "state_invalid",
  state_bad_signature: "state_invalid",
  state_expired: "state_expired",
  state_provider_mismatch: "state_mismatch",
  state_value_mismatch: "state_mismatch",
};

/** Provider-reported codes (`access_denied`, `user_cancelled_login`, ...). */
const PROVIDER_ERROR_PATTERN = /^[a-z0-9_]{1,40}$/i;

function providerErrorCode(raw: string | null): string {
  if (!raw) return "provider_error";
  return PROVIDER_ERROR_PATTERN.test(raw) ? raw.toLowerCase() : "provider_error";
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

  /** Always clears the one-shot state cookie and never caches the outcome. */
  function finish(location: string) {
    const response = NextResponse.redirect(location, { status: 303 });
    response.cookies.set(clearedOAuthStateCookie());
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const searchParams = request.nextUrl.searchParams;

  const verification = verifyOAuthState({
    cookieValue: request.cookies.get(OAUTH_STATE_COOKIE)?.value,
    stateParam: searchParams.get("state"),
    provider,
  });

  if (!verification.ok) {
    // No code exchange is attempted and the browser is sent to a page that can
    // only render a fixed message.
    return finish(`${DEFAULT_RETURN_PATH}?error=${STATE_FAILURE_CODE[verification.reason]}`);
  }

  const returnTo = verification.returnTo;

  // The admin declined at the provider, or the provider refused. Reported as a
  // short code, never as a reflected description.
  const consentError = searchParams.get("error");
  if (consentError) {
    return finish(`${returnTo}?error=${providerErrorCode(consentError)}`);
  }

  const code = searchParams.get("code");
  if (!code) {
    return finish(`${returnTo}?error=missing_code`);
  }

  const adapter = adapterForSlug(provider);

  try {
    // The adapter encrypts before returning, so `connected` holds ciphertext.
    const connected = await adapter.exchangeCode(code);

    await prisma.socialAccount.upsert({
      where: { provider: slugToProvider(provider) },
      create: {
        provider: slugToProvider(provider),
        accessTokenEnc: connected.accessTokenEnc,
        refreshTokenEnc: connected.refreshTokenEnc,
        expiresAt: connected.expiresAt,
        accountRef: connected.accountRef,
        displayName: connected.displayName,
        scopes: connected.scopes,
      },
      update: {
        accessTokenEnc: connected.accessTokenEnc,
        refreshTokenEnc: connected.refreshTokenEnc,
        expiresAt: connected.expiresAt,
        accountRef: connected.accountRef,
        displayName: connected.displayName,
        scopes: connected.scopes,
        connectedAt: new Date(),
      },
    });
  } catch (error) {
    // Only the error name reaches the log. Authorization codes and tokens are
    // short-lived credentials; they do not belong in a log file.
    console.error(
      `[social] ${provider} connect failed:`,
      error instanceof Error ? error.name : "unknown",
    );
    return finish(`${returnTo}?error=exchange_failed`);
  }

  return finish(`${returnTo}?connected=${provider}`);
}
