import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { getEnv } from "@/lib/env";

/**
 * Small crypto helpers: social token encryption at rest, password hashing checks,
 * short-lived HMAC tokens for the internal PDF render surfaces, and content hashing.
 */

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

function keyFrom(secret: string): Buffer {
  // Any configured secret becomes a stable 32-byte key. The secret is the entropy
  // source, so it must be long — enforced by the env schema.
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a social access/refresh token for storage.
 * Throws when SOCIAL_TOKEN_KEY is absent — callers must fail closed rather than
 * persisting a plaintext credential.
 */
export function encryptSecret(plaintext: string): string {
  const env = getEnv();
  if (!env.SOCIAL_TOKEN_KEY) {
    throw new Error(
      "SOCIAL_TOKEN_KEY is not set — refusing to store a social token in plaintext.",
    );
  }
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, keyFrom(env.SOCIAL_TOKEN_KEY), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  const env = getEnv();
  if (!env.SOCIAL_TOKEN_KEY) {
    throw new Error("SOCIAL_TOKEN_KEY is not set — cannot decrypt a social token.");
  }
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Malformed encrypted secret payload.");
  }
  const [, ivPart, tagPart, dataPart] = parts as [string, string, string, string];
  const decipher = createDecipheriv(
    ALGO,
    keyFrom(env.SOCIAL_TOKEN_KEY),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/** Constant-time string comparison for anything credential-shaped. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Deterministic content hash for cache-keying generated assets and for stable
 * "designed" fallback artwork per project slug.
 */
export function contentHash(value: unknown): string {
  return sha256(stableStringify(value));
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

/**
 * Short-lived HMAC token guarding the internal /render/cv/* surfaces.
 * These routes exist only so Chromium can print them; they must never be
 * publicly reachable or crawlable.
 */
export function signRenderToken(ttlSeconds = 300): string {
  const env = getEnv();
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const mac = createHmac("sha256", env.AUTH_SECRET).update(String(exp)).digest("base64url");
  return `${exp}.${mac}`;
}

export function verifyRenderToken(token: string | null): boolean {
  if (!token) return false;
  const [expPart, macPart] = token.split(".");
  if (!expPart || !macPart) return false;

  const exp = Number(expPart);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const env = getEnv();
  const expected = createHmac("sha256", env.AUTH_SECRET)
    .update(String(exp))
    .digest("base64url");

  return safeEqual(macPart, expected);
}
