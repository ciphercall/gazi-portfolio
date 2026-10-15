import { z } from "zod";

/**
 * Server environment. Validated once, at first access, so a misconfigured stack
 * fails loudly with a readable message instead of `undefined` propagating into
 * a query or an OAuth call.
 *
 * Deliberately lazy: `next build` must succeed without a database or any social
 * credentials present, so nothing here is evaluated at module-import time.
 */

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),

  /** Postgres. Required — there is no useful fallback. */
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (postgresql://...)"),

  /** Signs the admin session cookie. 32+ chars. */
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),

  /** Public origin, used for absolute URLs, OG tags, sitemap and share links. */
  SITE_URL: z.string().url().default("http://localhost:8023"),
  SITE_NAME: z.string().default("Gazi Monir-Uz-Zaman"),

  /** Media volume root inside the container. */
  MEDIA_ROOT: z.string().default("/srv/media"),

  /** Build provenance, surfaced by /api/health. */
  GIT_SHA: z.string().default("unknown"),

  /** AES-256-GCM key for social tokens. Optional — OAuth connect fails closed without it. */
  SOCIAL_TOKEN_KEY: z.string().optional(),

  /** LinkedIn — 3-legged OAuth. Optional. */
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),

  /** Meta — posting to a Facebook Page. Optional. */
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${details}\n\n` +
        `Run "portfolio-deploy.ps1 -Action env" to bootstrap deploy/.env from .env.example.`,
    );
  }

  cached = parsed.data;
  return cached;
}

/** Social publishing is opt-in; without a token key it must refuse, never store plaintext. */
export function isSocialPublishingConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.SOCIAL_TOKEN_KEY && env.SOCIAL_TOKEN_KEY.length >= 32);
}

export function isLinkedInConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET);
}

export function isFacebookConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET);
}
