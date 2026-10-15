import type { SocialProvider, SocialSubject } from "@/generated/prisma/enums";

/**
 * Shared shapes for the social publishing stack.
 *
 * Type-only imports and no runtime imports at all, so this module stays safe to
 * reach from a client component that only wants a string union: `import type` is
 * fully erased and nothing here pulls Prisma or `node:crypto` into a browser
 * bundle.
 *
 * THE ONE THING TO KEEP IN MIND WHILE READING THIS FEATURE
 * -------------------------------------------------------
 * LinkedIn and Meta expose *publishing* APIs. Neither one can add to or edit the
 * "Experience" (or any other profile) section of an account, and no third-party
 * tool can do it either. So "publish this experience" always means "post about
 * it", never "write it into the profile". Every module below is written to that
 * constraint; none of them ever attempts a profile write.
 */

/** `"LINKEDIN" | "FACEBOOK"`, straight from the Prisma schema. */
export type Provider = SocialProvider;

/** `"EXPERIENCE" | "PROJECT"`. */
export type SubjectType = SocialSubject;

/** Lowercase form used in URLs, cookie payloads and the connect routes. */
export type ProviderSlug = "linkedin" | "facebook";

export interface ProviderMeta {
  slug: ProviderSlug;
  provider: Provider;
  /** Human name for the connection card. */
  label: string;
  /** What connecting actually enables — stated plainly, no overselling. */
  capability: string;
}

/** Both providers, in the order the admin panel lists them. */
export const PROVIDERS: readonly ProviderMeta[] = [
  {
    slug: "linkedin",
    provider: "LINKEDIN",
    label: "LinkedIn",
    capability:
      "Posts to your personal LinkedIn feed as you. It cannot add or edit anything in your profile's Experience section — no API can do that.",
  },
  {
    slug: "facebook",
    provider: "FACEBOOK",
    label: "Facebook",
    capability:
      "Posts to a Facebook Page you administer. A personal Facebook profile cannot be posted to by any API, so a Page is required.",
  },
];

export function isProviderSlug(value: string): value is ProviderSlug {
  return value === "linkedin" || value === "facebook";
}

export function slugToProvider(slug: ProviderSlug): Provider {
  return slug === "linkedin" ? "LINKEDIN" : "FACEBOOK";
}

export function providerToSlug(provider: Provider): ProviderSlug {
  return provider === "LINKEDIN" ? "linkedin" : "facebook";
}

/**
 * Result of an OAuth code exchange, ready to be written to `SocialAccount`.
 *
 * Note what is deliberately absent: the plaintext token. Each adapter encrypts
 * with `encryptSecret` *inside its own module* and returns only ciphertext, so a
 * usable credential never crosses a module boundary and cannot be accidentally
 * spread into a response body, a log line or a React prop.
 */
export interface ConnectResult {
  /** AES-256-GCM ciphertext produced by `encryptSecret`. */
  accessTokenEnc: string;
  /** Ciphertext, or null when the provider issued no refresh token. */
  refreshTokenEnc: string | null;
  /**
   * When the access token stops working, or null when the provider does not
   * expire it (Facebook Page tokens derived from a long-lived user token have
   * no expiry date).
   */
  expiresAt: Date | null;
  /** LinkedIn member URN (`urn:li:person:...`) or the Facebook Page id. */
  accountRef: string;
  /** Shown on the connection card so it is obvious *which* account is wired up. */
  displayName: string;
  /** Space- or comma-delimited scopes, as the provider reported them. */
  scopes: string;
}

/** Outcome of one publish attempt. Safe to serialise — it never holds a token. */
export interface PublishResult {
  ok: boolean;
  /** Provider-side id of the created post. */
  externalId?: string;
  /** Public URL of the created post, when the provider's docs define one. */
  permalink?: string;
  /** Admin-readable failure reason. Never contains a credential. */
  error?: string;
  /** True when the stored token is dead and the account must be reconnected. */
  needsReconnect?: boolean;
}

/**
 * A token that has been decrypted for exactly one outbound request.
 *
 * This is the only shape in the codebase that carries a plaintext credential.
 * It is created inside `publishDispatch`, handed straight to one adapter call in
 * the same tick, and never stored, logged, serialised or passed to a component.
 */
export interface DecryptedAccount {
  provider: Provider;
  accessToken: string;
  accountRef: string;
  displayName: string;
}

export interface SocialProviderAdapter {
  readonly slug: ProviderSlug;
  readonly provider: Provider;
  /**
   * The provider's consent URL, or `null` when this provider has no client id
   * and secret configured. Callers must surface "not configured" rather than
   * attempting a request, so a dead button never appears in the UI.
   */
  authorizeUrl(state: string): string | null;
  /** Exchange an authorization code. Encrypts before returning. */
  exchangeCode(code: string): Promise<ConnectResult>;
  /** Create one post on behalf of the connected account. */
  publish(account: DecryptedAccount, message: string, link?: string): Promise<PublishResult>;
  /** Env var names this provider still needs. Empty when fully configured. */
  missingConfig(): string[];
}
