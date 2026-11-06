import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";

/**
 * Provider credentials, resolved database-first and environment-second.
 *
 * Why the database: an API key that can only be supplied by editing `deploy/.env`
 * and restarting the stack is not "enter it in the admin panel". The panel writes
 * these rows, and every consumer reads them through this module, so a saved key
 * takes effect on the next request with no redeploy.
 *
 * Why the environment still wins as a fallback: an existing deployment already
 * has the keys in `.env`, and removing that path would break it for no gain. The
 * DB row is an override, not a replacement.
 *
 * Secrets are AES-256-GCM ciphertext at rest, keyed by SOCIAL_TOKEN_KEY — the
 * same fail-closed rule as social tokens: without that key nothing is stored and
 * nothing is decrypted.
 */

export const CREDENTIAL_KEYS = {
  linkedinClientId: "social.linkedin.clientId",
  linkedinClientSecret: "social.linkedin.clientSecret",
  facebookAppId: "social.facebook.appId",
  facebookAppSecret: "social.facebook.appSecret",
} as const;

export interface LinkedInCredentials {
  clientId: string;
  clientSecret: string;
}

export interface FacebookCredentials {
  appId: string;
  appSecret: string;
}

export interface SocialCredentials {
  linkedin: LinkedInCredentials | null;
  facebook: FacebookCredentials | null;
}

/** Short-lived memo so one page render does not hit Postgres per card. */
const CACHE_TTL_MS = 5_000;
let cache: { at: number; value: SocialCredentials } | null = null;

export function clearCredentialsCache(): void {
  cache = null;
}

/** Plaintext value of one setting, or null when absent/unreadable. */
export async function readSetting(key: string): Promise<string | null> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    if (!row) return null;
    if (!row.isSecret) return row.value;
    try {
      return decryptSecret(row.value);
    } catch {
      // Encrypted with a different SOCIAL_TOKEN_KEY: treat as unusable rather
      // than handing ciphertext to an API call.
      return null;
    }
  } catch {
    // The database may not exist yet (build, first boot). Missing is not fatal.
    return null;
  }
}

/** Write a (secret) setting. Throws when SOCIAL_TOKEN_KEY is absent — fail closed. */
export async function writeSecretSetting(key: string, plaintext: string): Promise<void> {
  const value = encryptSecret(plaintext);
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value, isSecret: true },
    update: { value, isSecret: true },
  });
  clearCredentialsCache();
}

/** Write a non-secret setting (schedule defaults, toggles). */
export async function writeSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value, isSecret: false },
    update: { value, isSecret: false },
  });
  clearCredentialsCache();
}

export async function deleteSetting(key: string): Promise<void> {
  await prisma.appSetting.deleteMany({ where: { key } });
  clearCredentialsCache();
}

async function resolvePair(
  idKey: string,
  secretKey: string,
  envPair: { id: string | undefined; secret: string | undefined },
): Promise<{ id: string; secret: string } | null> {
  const [storedId, storedSecret] = await Promise.all([
    readSetting(idKey),
    readSetting(secretKey),
  ]);

  // A database pair only counts when both halves are present; a half-filled row
  // would otherwise disable a working env-configured provider.
  if (storedId && storedSecret) return { id: storedId, secret: storedSecret };
  if (envPair.id && envPair.secret) return { id: envPair.id, secret: envPair.secret };
  return null;
}

export async function getSocialCredentials(): Promise<SocialCredentials> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.value;

  const env = getEnv();
  const [linkedin, facebook] = await Promise.all([
    resolvePair(CREDENTIAL_KEYS.linkedinClientId, CREDENTIAL_KEYS.linkedinClientSecret, {
      id: env.LINKEDIN_CLIENT_ID,
      secret: env.LINKEDIN_CLIENT_SECRET,
    }),
    resolvePair(CREDENTIAL_KEYS.facebookAppId, CREDENTIAL_KEYS.facebookAppSecret, {
      id: env.FACEBOOK_APP_ID,
      secret: env.FACEBOOK_APP_SECRET,
    }),
  ]);

  const value: SocialCredentials = {
    linkedin: linkedin ? { clientId: linkedin.id, clientSecret: linkedin.secret } : null,
    facebook: facebook ? { appId: facebook.id, appSecret: facebook.secret } : null,
  };

  cache = { at: Date.now(), value };
  return value;
}

export async function isLinkedInConfiguredAsync(): Promise<boolean> {
  return (await getSocialCredentials()).linkedin !== null;
}

export async function isFacebookConfiguredAsync(): Promise<boolean> {
  return (await getSocialCredentials()).facebook !== null;
}

/** Names of the settings still missing for one provider, for the connection card. */
export async function missingProviderConfig(provider: "linkedin" | "facebook"): Promise<string[]> {
  const creds = await getSocialCredentials();
  const env = getEnv();
  const missing: string[] = [];

  if (provider === "linkedin") {
    if (!creds.linkedin) {
      missing.push("LinkedIn client ID");
      missing.push("LinkedIn client secret");
    }
  } else if (!creds.facebook) {
    missing.push("Facebook app ID");
    missing.push("Facebook app secret");
  }

  if (!env.SOCIAL_TOKEN_KEY || env.SOCIAL_TOKEN_KEY.length < 32) {
    missing.push("SOCIAL_TOKEN_KEY");
  }

  return missing;
}
