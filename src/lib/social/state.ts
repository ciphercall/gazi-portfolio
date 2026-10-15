import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getEnv } from "@/lib/env";

import type { ProviderSlug } from "@/lib/social/types";

/**
 * CSRF-safe OAuth `state`.
 *
 * `node:crypto` is used deliberately: the connect and callback routes run on the
 * Node runtime (they touch Prisma and AES-256-GCM), so there is nothing to gain
 * from an edge-compatible implementation — and keeping this module off the edge
 * path means `middleware.ts` can never accidentally pull a Node-only import into
 * the edge bundle.
 *
 * Two independent checks protect the round-trip, and both are needed because
 * they stop different attacks:
 *
 *   1. A random nonce travels in an `httpOnly` cookie and is echoed back as the
 *      `state` query parameter. `SameSite=Lax` still sends the cookie on a
 *      top-level GET navigation, so a cross-site attacker *can* make the admin's
 *      browser hit our callback — but it cannot read the cookie, so it cannot
 *      supply a matching nonce. That is the CSRF guarantee.
 *   2. An HMAC-SHA256 over the whole payload (nonce, provider, expiry and the
 *      admin return path) means the payload cannot be forged or replayed into
 *      the other provider's callback. The provider name is inside the signed
 *      bytes, so binding is enforced by the signature, not by a later check that
 *      someone could forget to write.
 *
 * The payload is signed but NOT encrypted, which is fine and intentional: it
 * holds a nonce, an expiry, a provider slug and an `/admin` path. No client
 * secret and no token ever goes in, and the cookie is httpOnly so no script can
 * read it back out.
 */

/** Short-lived: the code LinkedIn/Meta hands back is only valid for minutes. */
const STATE_TTL_SECONDS = 10 * 60;

export const OAUTH_STATE_COOKIE = "gp_oauth_state";
/** Scoped so an unrelated request to the site never carries this cookie. */
export const OAUTH_STATE_COOKIE_PATH = "/api/social";

export type StateFailure =
  | "state_cookie_missing"
  | "state_parameter_missing"
  | "state_malformed"
  | "state_bad_signature"
  | "state_expired"
  | "state_provider_mismatch"
  | "state_value_mismatch";

export type StateVerification =
  | { ok: true; returnTo: string }
  | { ok: false; reason: StateFailure };

export interface OAuthStateCookie {
  name: string;
  value: string;
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
}

export interface StartedOAuthState {
  /** Value for the `state` query parameter on the provider's consent URL. */
  state: string;
  /** Attach to the redirect response with `response.cookies.set(cookie)`. */
  cookie: OAuthStateCookie;
}

interface StatePayload {
  /** Nonce — the random half, echoed back as `state`. */
  n: string;
  /** Provider slug this state was minted for. */
  p: ProviderSlug;
  /** Expiry, unix seconds. */
  e: number;
  /** Same-origin `/admin` path to return to once the round-trip completes. */
  r: string;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function hmac(payloadPart: string): string {
  const env = getEnv();
  return createHmac("sha256", env.AUTH_SECRET).update(payloadPart).digest("base64url");
}

/** Constant-time string compare that tolerates length differences. */
function equalConstantTime(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * True when `value` is a path on this site under `/admin`.
 *
 * Fail-closed by design: an open redirect in an OAuth callback is a phishing
 * gift, so anything that is not provably a same-origin `/admin` path is
 * rejected. Protocol-relative (`//evil.example`), absolute (`https://evil`),
 * backslash-smuggled (`/\evil.example`) and control-character-bearing values
 * all fail, as does anything that parses to a different origin.
 */
export function isSafeAdminReturnPath(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length === 0 || value.length > 512) return false;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;

  try {
    const url = new URL(value, "https://return-path.invalid");
    if (url.origin !== "https://return-path.invalid") return false;
    return url.pathname === "/admin" || url.pathname.startsWith("/admin/");
  } catch {
    return false;
  }
}

/** The default destination once a provider is connected. */
export const DEFAULT_RETURN_PATH = "/admin/social";

/** A state cookie carrying `value`, live for the full state TTL. */
export function oauthStateCookie(value: string): OAuthStateCookie {
  return {
    name: OAUTH_STATE_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax",
    // Not readable by script, and only ever sent over HTTPS in production.
    secure: process.env.NODE_ENV === "production",
    // Scoped to the OAuth routes: no other request to this site needs it.
    path: OAUTH_STATE_COOKIE_PATH,
    maxAge: STATE_TTL_SECONDS,
  };
}

/**
 * Single-use state: every terminal path through the callback calls this, so a
 * captured callback URL cannot be replayed afterwards.
 */
export function clearedOAuthStateCookie(): OAuthStateCookie {
  return { ...oauthStateCookie(""), maxAge: 0 };
}

/**
 * Mint a fresh state for one connect attempt.
 *
 * Call this immediately before redirecting to the provider and attach the
 * returned cookie to *that* response.
 */
export function beginOAuthState(input: {
  provider: ProviderSlug;
  returnTo?: string | null;
}): StartedOAuthState {
  const nonce = randomBytes(32).toString("base64url");
  const returnTo = isSafeAdminReturnPath(input.returnTo) ? input.returnTo : DEFAULT_RETURN_PATH;

  const payload: StatePayload = {
    n: nonce,
    p: input.provider,
    e: Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS,
    r: returnTo,
  };

  const payloadPart = base64url(JSON.stringify(payload));
  const signature = hmac(payloadPart);

  return {
    state: nonce,
    cookie: oauthStateCookie(`${payloadPart}.${signature}`),
  };
}

/**
 * Verify a callback against the cookie that started it.
 *
 * Order matters: integrity first (so we never act on an unsigned payload), then
 * expiry, then the provider binding, and only then the CSRF comparison. The
 * caller must refuse the code exchange on any failure.
 */
export function verifyOAuthState(input: {
  cookieValue: string | undefined;
  stateParam: string | null;
  provider: ProviderSlug;
}): StateVerification {
  const { cookieValue, stateParam, provider } = input;

  if (!cookieValue) return { ok: false, reason: "state_cookie_missing" };
  if (!stateParam) return { ok: false, reason: "state_parameter_missing" };

  const separator = cookieValue.indexOf(".");
  if (separator <= 0) return { ok: false, reason: "state_malformed" };

  const payloadPart = cookieValue.slice(0, separator);
  const signaturePart = cookieValue.slice(separator + 1);
  if (!payloadPart || !signaturePart) return { ok: false, reason: "state_malformed" };

  if (!equalConstantTime(signaturePart, hmac(payloadPart))) {
    return { ok: false, reason: "state_bad_signature" };
  }

  let payload: StatePayload;
  try {
    const decoded: unknown = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
    if (!decoded || typeof decoded !== "object") return { ok: false, reason: "state_malformed" };
    const candidate = decoded as Partial<StatePayload>;
    if (
      typeof candidate.n !== "string" ||
      typeof candidate.e !== "number" ||
      typeof candidate.r !== "string" ||
      (candidate.p !== "linkedin" && candidate.p !== "facebook")
    ) {
      return { ok: false, reason: "state_malformed" };
    }
    payload = candidate as StatePayload;
  } catch {
    return { ok: false, reason: "state_malformed" };
  }

  if (payload.e < Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: "state_expired" };
  }

  // The provider slug is signed, so a LinkedIn state cannot be replayed into the
  // Facebook callback (or the reverse) to attach a token to the wrong account.
  if (payload.p !== provider) {
    return { ok: false, reason: "state_provider_mismatch" };
  }

  if (!equalConstantTime(payload.n, stateParam)) {
    return { ok: false, reason: "state_value_mismatch" };
  }

  // Re-validated on the way out: the signature proves *we* wrote it, this proves
  // it is still a path we are willing to redirect a browser to.
  const returnTo = isSafeAdminReturnPath(payload.r) ? payload.r : DEFAULT_RETURN_PATH;

  return { ok: true, returnTo };
}
