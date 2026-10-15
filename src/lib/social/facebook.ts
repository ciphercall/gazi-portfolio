import { createHmac } from "node:crypto";

import { encryptSecret } from "@/lib/crypto";
import { getEnv, isFacebookConfigured } from "@/lib/env";

import type {
  ConnectResult,
  DecryptedAccount,
  ProviderSlug,
  PublishResult,
  SocialProviderAdapter,
} from "@/lib/social/types";

/**
 * Facebook (Meta) adapter — post to a Facebook PAGE.
 *
 * ============================================================================
 *  VERIFIED AGAINST LIVE META DOCUMENTATION ON 2026-10-15
 * ============================================================================
 *
 * Login dialog + code exchange
 *   https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
 *   - Dialog:  https://www.facebook.com/<version>/dialog/oauth
 *                ?client_id=<app-id>&redirect_uri=<uri>&state=<state>
 *              (+ optional `scope` = comma- or space-separated permissions,
 *               optional `response_type=code`, which is also the default)
 *   - Exchange: GET https://graph.facebook.com/<version>/oauth/access_token
 *                 ?client_id=<app-id>&redirect_uri=<uri>
 *                 &client_secret=<app-secret>&code=<code>
 *               returns { access_token, token_type, expires_in }
 *   - Denied consent: the redirect carries
 *               ?error=access_denied&error_reason=user_denied&error_description=...
 *
 * Short-lived -> long-lived user token -> Page token
 *   https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived
 *   - GET https://graph.facebook.com/<version>/oauth/access_token
 *         ?grant_type=fb_exchange_token&client_id=<app-id>
 *         &client_secret=<app-secret>&fb_exchange_token=<short-lived-token>
 *     returns { access_token, token_type, expires_in } — a long-lived user
 *     token, "generally lasts about 60 days".
 *   - GET https://graph.facebook.com/<version>/<app-scoped-user-id>/accounts
 *         ?access_token=<long-lived-user-token>
 *     returns data[] where each Page node carries access_token, id, name,
 *     category and tasks.
 *     Quoted from the same page: "Long-lived Page access token do not have an
 *     expiration date and only expire or are invalidated under certain
 *     conditions."
 *   Reference for the edge: https://developers.facebook.com/docs/graph-api/reference/user/accounts/
 *
 * Publishing
 *   https://developers.facebook.com/docs/pages-api/posts/
 *   - POST https://graph.facebook.com/<version>/<page-id>/feed
 *       params: message, link, published
 *               ("published set to `true` to publish the post immediately (default)")
 *       returns { "id": "page_post_id" }
 *   - Documented permalink: "The URL, or permalink, for a Page post is
 *     https://www.facebook.com/<page_post_id>"
 *
 * Permissions
 *   https://developers.facebook.com/docs/permissions/reference/pages_show_list
 *   - pages_show_list      "allows your app to access the list of Pages a
 *                           person manages" (dependencies: none)
 *   - pages_read_engagement "allows your app to read content (posts, photos,
 *                           videos, events) posted by the Page"
 *   - pages_manage_posts    "allows your app to create, edit and delete your
 *                           Page posts"
 *   The Pages API guide asks for exactly these before posting as the Page.
 *
 * Request hardening
 *   https://developers.facebook.com/docs/graph-api/guides/secure-requests
 *   - Server-to-server calls "can be better secured by adding a parameter called
 *     appsecret_proof", which is a SHA-256 HMAC of the access token keyed with
 *     the app secret. It is sent on every Graph call below.
 *   - None of the Meta pages consulted document an `Authorization: Bearer`
 *     header for Graph API; every example passes the token as an
 *     `access_token` parameter. That documented form is used here.
 *
 * API version
 *   https://developers.facebook.com/docs/graph-api/changelog
 *   - "The latest Graph API version is: v26.0", introduced 2026-07-29 and with
 *     no sunset date published yet. (The Pages API guide and the manual-login
 *     guide still show v25.0 in their examples; v25.0 is listed as available
 *     until 2028-07-29.) v26.0 is pinned below and noted here so the next reader
 *     can see exactly what was checked and when.
 *
 * ============================================================================
 *  WHY A PAGE, AND WHY THAT IS NOT A LIMITATION WE CAN WORK AROUND
 * ============================================================================
 * There is no API that posts to a personal Facebook profile. The Pages API
 * publishes as a Page the connected user administers. If the account has no
 * Page, connecting fails with a plain explanation rather than a silent no-op.
 */

/** Pinned 2026-10-15 — see the API version note above. */
const GRAPH_API_VERSION = "v26.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/** Scopes requested at consent, in the order the Pages API guide lists them. */
export const FACEBOOK_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
] as const;

const REQUEST_TIMEOUT_MS = 20_000;

interface FacebookCredentials {
  appId: string;
  appSecret: string;
}

function credentials(): FacebookCredentials | null {
  const env = getEnv();
  if (!env.FACEBOOK_APP_ID || !env.FACEBOOK_APP_SECRET) return null;
  return { appId: env.FACEBOOK_APP_ID, appSecret: env.FACEBOOK_APP_SECRET };
}

/**
 * Must stay byte-identical to the redirect URI registered under
 * Facebook Login > Settings in the app dashboard.
 * `deploy/.env.example` documents this exact path.
 */
function callbackUrl(): string {
  return new URL("/api/social/facebook/callback", getEnv().SITE_URL).toString();
}

/** The documented `appsecret_proof`: HMAC-SHA256(access token) keyed by app secret. */
function appSecretProof(accessToken: string, appSecret: string): string {
  return createHmac("sha256", appSecret).update(accessToken).digest("hex");
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

interface GraphError {
  message: string;
  code: number | null;
  subcode: number | null;
  type: string;
}

/**
 * Meta returns errors as `{ "error": { message, type, code, error_subcode } }`.
 * Only those documented fields are read — never the raw envelope — so a
 * credential can never end up quoted into a stored error message.
 */
function readGraphError(payload: Record<string, unknown>): GraphError {
  const raw = payload.error;
  if (!raw || typeof raw !== "object") {
    return { message: "", code: null, subcode: null, type: "" };
  }
  const error = raw as Record<string, unknown>;
  return {
    message: asString(error.message).slice(0, 300),
    code: asFiniteNumber(error.code),
    subcode: asFiniteNumber(error.error_subcode),
    type: asString(error.type),
  };
}

function describeFailure(status: number, error: GraphError): string {
  const parts = [`Facebook responded HTTP ${status}.`];
  if (error.code !== null) parts.push(`code=${error.code}`);
  if (error.subcode !== null) parts.push(`subcode=${error.subcode}`);
  if (error.message) parts.push(error.message);
  return parts.join(" ").slice(0, 400);
}

/**
 * Meta's documented "Invalid OAuth 2.0 Access Token" is error code 190 (listed
 * on the user-accounts reference alongside 459, 200, 100, 283). A 401 status is
 * treated the same way. Both mean the grant is gone, not that the post was
 * rejected, so the admin is told to reconnect rather than to retry blindly.
 */
function looksLikeDeadToken(status: number, error: GraphError): boolean {
  if (status === 401) return true;
  if (error.code === 190 || error.code === 102) return true;
  const message = error.message.toLowerCase();
  return (
    message.includes("access token") &&
    (message.includes("expired") || message.includes("invalid") || message.includes("session"))
  );
}

async function graphGet(path: string, params: Record<string, string>): Promise<{
  status: number;
  payload: Record<string, unknown>;
}> {
  const url = new URL(`${GRAPH_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  let payload: Record<string, unknown> = {};
  try {
    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      payload = parsed as Record<string, unknown>;
    }
  } catch {
    payload = {};
  }

  return { status: response.status, payload };
}

/** One page node as returned by the `/{user-id}/accounts` edge. */
interface PageNode {
  id: string;
  name: string;
  accessToken: string;
}

function readFirstPage(payload: Record<string, unknown>): PageNode | null {
  const data = payload.data;
  if (!Array.isArray(data)) return null;

  for (const entry of data) {
    if (!entry || typeof entry !== "object") continue;
    const node = entry as Record<string, unknown>;
    const id = asString(node.id);
    const accessToken = asString(node.access_token);
    if (!id || !accessToken) continue;
    return { id, name: asString(node.name) || `Page ${id}`, accessToken };
  }
  return null;
}

export const facebookAdapter: SocialProviderAdapter = {
  slug: "facebook" satisfies ProviderSlug,
  provider: "FACEBOOK",

  /**
   * Returns null when the app is not configured, so the panel can explain what
   * is missing instead of offering a button that cannot work.
   */
  authorizeUrl(state: string): string | null {
    if (!isFacebookConfigured()) return null;
    const creds = credentials();
    if (!creds) return null;

    const url = new URL(`https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth`);
    url.searchParams.set("client_id", creds.appId);
    url.searchParams.set("redirect_uri", callbackUrl());
    url.searchParams.set("state", state);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", FACEBOOK_SCOPES.join(","));
    return url.toString();
  },

  async exchangeCode(code: string): Promise<ConnectResult> {
    const creds = credentials();
    if (!creds) {
      throw new Error(
        "Facebook is not configured — set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.",
      );
    }

    // Step 1 — short-lived user token from the authorization code.
    const shortLived = await graphGet("oauth/access_token", {
      client_id: creds.appId,
      redirect_uri: callbackUrl(),
      client_secret: creds.appSecret,
      code,
    });

    if (shortLived.status >= 400) {
      throw new Error(`Facebook rejected the authorization code (HTTP ${shortLived.status}).`);
    }

    const shortLivedToken = asString(shortLived.payload.access_token);
    if (!shortLivedToken) {
      throw new Error("Facebook returned no access token for the authorization code.");
    }

    // Step 2 — exchange it for a long-lived user token, which is what makes the
    // resulting Page token durable rather than a few-hours grant.
    const longLived = await graphGet("oauth/access_token", {
      grant_type: "fb_exchange_token",
      client_id: creds.appId,
      client_secret: creds.appSecret,
      fb_exchange_token: shortLivedToken,
    });

    if (longLived.status >= 400) {
      const error = readGraphError(longLived.payload);
      throw new Error(
        `Facebook would not exchange the token for a long-lived one (HTTP ${longLived.status}). ${error.message}`.trim(),
      );
    }

    const userToken = asString(longLived.payload.access_token) || shortLivedToken;

    // Step 3 — read the Pages this user administers and take that Page's token.
    const accounts = await graphGet("me/accounts", {
      access_token: userToken,
      appsecret_proof: appSecretProof(userToken, creds.appSecret),
    });

    if (accounts.status >= 400) {
      const error = readGraphError(accounts.payload);
      throw new Error(
        `Facebook would not list your Pages (HTTP ${accounts.status}). ${error.message}`.trim(),
      );
    }

    const page = readFirstPage(accounts.payload);
    if (!page) {
      throw new Error(
        "This Facebook account does not administer a Page. Facebook only allows an app to post as a Page — a personal profile cannot be posted to by any API. Create or take admin rights on a Page, then connect again.",
      );
    }

    // A user can administer several Pages. Only one token fits in the single
    // `SocialAccount` row (unique on provider), so the first Page is used and
    // its name is stored as `displayName` — the connection card then shows
    // exactly which Page the panel will post to.
    return {
      // Encrypted before returning: the plaintext Page token never leaves this
      // function scope, so no caller can serialise it by accident.
      accessTokenEnc: encryptSecret(page.accessToken),
      refreshTokenEnc: null,
      // Documented: a long-lived Page token has no expiration date.
      expiresAt: null,
      accountRef: page.id,
      displayName: page.name,
      scopes: FACEBOOK_SCOPES.join(","),
    };
  },

  async publish(account: DecryptedAccount, message: string, link?: string): Promise<PublishResult> {
    const creds = credentials();
    if (!creds) {
      return { ok: false, error: "Facebook credentials were removed from the environment." };
    }

    const body: Record<string, unknown> = {
      message,
      // `published` is intentionally omitted: the Pages API documents `true`
      // (publish immediately) as the default, and this always publishes now.
      access_token: account.accessToken,
      appsecret_proof: appSecretProof(account.accessToken, creds.appSecret),
    };
    if (link) body.link = link;

    let response: Response;
    try {
      response = await fetch(`${GRAPH_BASE}/${encodeURIComponent(account.accountRef)}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      return {
        ok: false,
        error: `Could not reach Facebook: ${error instanceof Error ? error.message : "unknown network error"}`,
      };
    }

    let payload: Record<string, unknown> = {};
    try {
      const parsed: unknown = await response.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        payload = parsed as Record<string, unknown>;
      }
    } catch {
      payload = {};
    }

    if (!response.ok) {
      const error = readGraphError(payload);
      return {
        ok: false,
        error: describeFailure(response.status, error),
        needsReconnect: looksLikeDeadToken(response.status, error),
      };
    }

    const postId = asString(payload.id);
    if (!postId) {
      // The post exists; we just cannot address it. Reported as success so a
      // retry cannot duplicate it.
      return { ok: true };
    }

    return {
      ok: true,
      externalId: postId,
      // Documented permalink: https://www.facebook.com/<page_post_id>
      permalink: `https://www.facebook.com/${postId}`,
    };
  },

  missingConfig(): string[] {
    const env = getEnv();
    const missing: string[] = [];
    if (!env.FACEBOOK_APP_ID) missing.push("FACEBOOK_APP_ID");
    if (!env.FACEBOOK_APP_SECRET) missing.push("FACEBOOK_APP_SECRET");
    if (!env.SOCIAL_TOKEN_KEY || env.SOCIAL_TOKEN_KEY.length < 32) missing.push("SOCIAL_TOKEN_KEY");
    return missing;
  },
};
