import { encryptSecret } from "@/lib/crypto";
import { getEnv, isLinkedInConfigured } from "@/lib/env";

import type {
  ConnectResult,
  DecryptedAccount,
  ProviderSlug,
  PublishResult,
  SocialProviderAdapter,
} from "@/lib/social/types";

/**
 * LinkedIn adapter — 3-legged OAuth, then publish a post.
 *
 * ============================================================================
 *  VERIFIED AGAINST LIVE LINKEDIN DOCUMENTATION ON 2026-10-15
 * ============================================================================
 *
 * Authorization code flow
 *   https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 *   - GET  https://www.linkedin.com/oauth/v2/authorization
 *       required params: response_type=code, client_id, redirect_uri, scope
 *       optional param:  state  (space-delimited scope, URL-encoded)
 *   - POST https://www.linkedin.com/oauth/v2/accessToken
 *       Content-Type: application/x-www-form-urlencoded
 *       params: grant_type=authorization_code, code, client_id, client_secret,
 *               redirect_uri
 *       returns: access_token, expires_in (access tokens are issued with a
 *                60-day lifespan), refresh_token, refresh_token_expires_in, scope
 *
 * Member identity
 *   https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2
 *   - GET https://api.linkedin.com/v2/userinfo   (Authorization: Bearer <token>)
 *       returns: sub (subject identifier), name, given_name, family_name,
 *                picture, locale, email, email_verified
 *
 * Posts
 *   https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
 *   - POST https://api.linkedin.com/rest/posts
 *       headers: Authorization: Bearer <token>, Content-Type: application/json,
 *                Linkedin-Version: <YYYYMM>, X-Restli-Protocol-Version: 2.0.0
 *       scope:   w_member_social  ("Post, comment, and like posts on behalf of
 *                                   an authenticated member")
 *       body:    author, commentary, visibility, distribution.feedDistribution,
 *                lifecycleState, isReshareDisabledByAuthor
 *       success: HTTP 201, post id in the `x-restli-id` response header, e.g.
 *                urn:li:share:6844785523593134080 or urn:li:ugcPost:68447855235931240
 *       permalink (documented URL structure): the post is viewable at
 *                https://www.linkedin.com/feed/update/<urn>/
 *
 * Version header
 *   https://learn.microsoft.com/en-us/linkedin/marketing/versioning
 *   - Header key as documented: "Linkedin-Version" (HTTP header names are
 *     case-insensitive, so "LinkedIn-Version" is the same header).
 *     Value format is YYYYMM. The page's "Latest Version" table listed
 *     October 2026 as the newest release, whose header value is 202610.
 *     Versions are supported for a minimum of one year, so this constant is a
 *     deliberate, dated pin rather than a moving target.
 *
 * The `author` URN is composed as `urn:li:person:{sub}`. The share-on-LinkedIn
 * guide states the author is the "Person URN of the Member creating the share"
 * and points at Sign In with LinkedIn using OpenID Connect for retrieving it;
 * the only member identifier that flow returns is the `sub` claim.
 *
 * ============================================================================
 *  WHAT THIS ADAPTER CANNOT DO — AND WHY IT NEVER TRIES
 * ============================================================================
 * LinkedIn has no API that adds to or edits the "Experience" section of a
 * member's profile. The only profile-adjacent thing available to a normal app is
 * `w_member_social`, which creates posts. So every publish below creates a POST.
 * Nothing in this file reads or writes profile data, and the UI says the same
 * thing in plain words.
 */

const AUTHORIZE_ENDPOINT = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_ENDPOINT = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_ENDPOINT = "https://api.linkedin.com/v2/userinfo";
const POSTS_ENDPOINT = "https://api.linkedin.com/rest/posts";

/** Pinned 2026-10-15 — see the versioning note above. */
const LINKEDIN_VERSION = "202610";
const RESTLI_PROTOCOL_VERSION = "2.0.0";

/** The only LinkedIn scope this feature needs. */
export const LINKEDIN_SCOPE = "w_member_social";

const REQUEST_TIMEOUT_MS = 20_000;

function credentials(): { clientId: string; clientSecret: string } | null {
  const env = getEnv();
  if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) return null;
  return { clientId: env.LINKEDIN_CLIENT_ID, clientSecret: env.LINKEDIN_CLIENT_SECRET };
}

/**
 * Must stay byte-identical to the redirect URI registered on the LinkedIn app.
 * `deploy/.env.example` documents this exact path.
 */
function callbackUrl(): string {
  return new URL("/api/social/linkedin/callback", getEnv().SITE_URL).toString();
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * A short, admin-readable reason built only from documented error fields.
 *
 * The response body is never copied wholesale into a message: provider error
 * envelopes are not a place to trust blindly with credentials, and an
 * `error_description` is enough for a human to act on.
 */
function describeFailure(status: number, payload: Record<string, unknown>): string {
  const message = asString(payload.message);
  const code = asString(payload.code);
  const serviceErrorCode = asFiniteNumber(payload.serviceErrorCode);

  const parts = [`LinkedIn responded HTTP ${status}.`];
  if (code) parts.push(`code=${code}`);
  if (serviceErrorCode !== null) parts.push(`serviceErrorCode=${serviceErrorCode}`);
  if (message) parts.push(message);
  return parts.join(" ").slice(0, 400);
}

/** Token-shaped errors LinkedIn returns when the grant is gone. */
function looksLikeDeadToken(status: number, payload: Record<string, unknown>): boolean {
  if (status === 401) return true;
  const code = asString(payload.code).toUpperCase();
  if (code.includes("REVOKED") || code.includes("EXPIRED")) return true;
  const message = asString(payload.message).toLowerCase();
  return (
    message.includes("revoked") ||
    message.includes("expired access token") ||
    message.includes("invalid access token")
  );
}

async function postForm(
  url: string,
  body: URLSearchParams,
): Promise<{ status: number; payload: Record<string, unknown> }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { status: response.status, payload: await readJson(response) };
}

export const linkedInAdapter: SocialProviderAdapter = {
  slug: "linkedin" satisfies ProviderSlug,
  provider: "LINKEDIN",

  /**
   * Returns null when the app is not configured, so the caller renders a clear
   * "not configured" explanation instead of sending the admin to a broken
   * consent page.
   */
  authorizeUrl(state: string): string | null {
    if (!isLinkedInConfigured()) return null;
    const creds = credentials();
    if (!creds) return null;

    const url = new URL(AUTHORIZE_ENDPOINT);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", creds.clientId);
    url.searchParams.set("redirect_uri", callbackUrl());
    url.searchParams.set("state", state);
    url.searchParams.set("scope", LINKEDIN_SCOPE);
    return url.toString();
  },

  async exchangeCode(code: string): Promise<ConnectResult> {
    const creds = credentials();
    if (!creds) {
      throw new Error("LinkedIn is not configured — set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.");
    }

    const { status, payload } = await postForm(
      TOKEN_ENDPOINT,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        redirect_uri: callbackUrl(),
      }),
    );

    if (status >= 400) {
      // Deliberately generic: nothing from this exchange is echoed to the client
      // beyond a fixed error code, and no credential value is ever interpolated.
      throw new Error(`LinkedIn rejected the authorization code (HTTP ${status}).`);
    }

    const accessToken = asString(payload.access_token);
    if (!accessToken) {
      throw new Error("LinkedIn returned no access token.");
    }

    // The member id is needed as the post author, so it is fetched before the
    // token is stored: a half-connected account would be worse than a failed one.
    const infoResponse = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const info = await readJson(infoResponse);

    if (!infoResponse.ok) {
      throw new Error(`LinkedIn did not return your member profile (HTTP ${infoResponse.status}).`);
    }

    const sub = asString(info.sub);
    if (!sub) {
      throw new Error(
        "LinkedIn returned no member identifier (`sub`). Re-connect and make sure the `w_member_social` scope is granted.",
      );
    }

    const refreshToken = asString(payload.refresh_token);
    const expiresIn = asFiniteNumber(payload.expires_in);

    return {
      // The plaintext token lives only in this function scope and is encrypted
      // before it is returned; the caller receives ciphertext alone.
      accessTokenEnc: encryptSecret(accessToken),
      refreshTokenEnc: refreshToken ? encryptSecret(refreshToken) : null,
      expiresAt: expiresIn !== null ? new Date(Date.now() + expiresIn * 1000) : null,
      accountRef: `urn:li:person:${sub}`,
      displayName: asString(info.name) || "LinkedIn member",
      scopes: asString(payload.scope) || LINKEDIN_SCOPE,
    };
  },

  async publish(account: DecryptedAccount, message: string, link?: string): Promise<PublishResult> {
    // The Posts API "does not support URL scraping for article post creation",
    // and creating a real article post needs an uploaded image URN. Appending the
    // link to the commentary is the honest, always-available option: the post is
    // text plus a link, which is exactly what it claims to be.
    const commentary = link ? `${message}\n\n${link}` : message;

    let response: Response;
    try {
      response = await fetch(POSTS_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
          // Both headers are required by the Posts API. Header names are
          // case-insensitive; the spelling below is the one in the reference.
          "Linkedin-Version": LINKEDIN_VERSION,
          "X-Restli-Protocol-Version": RESTLI_PROTOCOL_VERSION,
        },
        body: JSON.stringify({
          author: account.accountRef,
          commentary,
          visibility: "PUBLIC",
          distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: [],
          },
          lifecycleState: "PUBLISHED",
          isReshareDisabledByAuthor: false,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      return {
        ok: false,
        error: `Could not reach LinkedIn: ${error instanceof Error ? error.message : "unknown network error"}`,
      };
    }

    const payload = await readJson(response);

    if (!response.ok) {
      return {
        ok: false,
        error: describeFailure(response.status, payload),
        needsReconnect: looksLikeDeadToken(response.status, payload),
      };
    }

    // Documented success: HTTP 201 with the post id in the `x-restli-id` header.
    const postUrn = response.headers.get("x-restli-id") ?? asString(payload.id);

    if (!postUrn) {
      // The post was created; we simply cannot address it. Reported as success
      // with no id rather than as a failure that would invite a duplicate post.
      return { ok: true };
    }

    return {
      ok: true,
      externalId: postUrn,
      // Documented permalink structure: https://www.linkedin.com/feed/update/<urn>/
      permalink: `https://www.linkedin.com/feed/update/${postUrn}/`,
    };
  },

  missingConfig(): string[] {
    const env = getEnv();
    const missing: string[] = [];
    if (!env.LINKEDIN_CLIENT_ID) missing.push("LINKEDIN_CLIENT_ID");
    if (!env.LINKEDIN_CLIENT_SECRET) missing.push("LINKEDIN_CLIENT_SECRET");
    if (!env.SOCIAL_TOKEN_KEY || env.SOCIAL_TOKEN_KEY.length < 32) missing.push("SOCIAL_TOKEN_KEY");
    return missing;
  },
};
