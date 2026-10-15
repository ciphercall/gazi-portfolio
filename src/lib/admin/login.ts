/**
 * Login-flow helpers: a rate limiter and a redirect sanitiser.
 *
 * Kept out of `src/lib/admin/data.ts` so the login route never pulls in the
 * panel's whole query surface.
 */

export interface LoginAttemptRecord {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  blockedUntil: number | null;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const BLOCK_MS = 15 * 60 * 1000;

/**
 * In-memory attempt counter for the login endpoint.
 *
 * Honest about what this is: a per-process counter. It stops a script from
 * hammering one container, and it is wiped by a redeploy or a second replica.
 * The real defence is bcrypt's cost plus a long random password; this is a
 * speed bump, not an account lockout system. A shared store (Redis, or a
 * `login_attempts` table) would be the next step if the panel were exposed to
 * the open internet.
 */
const attempts = new Map<string, LoginAttemptRecord>();

function keyFor(identifier: string): string {
  return identifier.toLowerCase().trim().slice(0, 200);
}

export function checkLoginAllowed(identifier: string): { allowed: boolean; retryAfterSeconds: number } {
  const key = keyFor(identifier);
  const record = attempts.get(key);
  const now = Date.now();

  if (!record) return { allowed: true, retryAfterSeconds: 0 };

  if (record.blockedUntil && record.blockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((record.blockedUntil - now) / 1000) };
  }

  if (now - record.firstAttemptAt > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordLoginFailure(identifier: string): { blocked: boolean; remaining: number } {
  const key = keyFor(identifier);
  const now = Date.now();
  const existing = attempts.get(key);

  const record: LoginAttemptRecord =
    existing && now - existing.firstAttemptAt <= WINDOW_MS
      ? { ...existing, count: existing.count + 1, lastAttemptAt: now }
      : { count: 1, firstAttemptAt: now, lastAttemptAt: now, blockedUntil: null };

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_MS;
  }

  attempts.set(key, record);
  return { blocked: record.blockedUntil !== null, remaining: Math.max(0, MAX_ATTEMPTS - record.count) };
}

export function clearLoginFailures(identifier: string): void {
  attempts.delete(keyFor(identifier));
}

/** Housekeeping so a long-running container does not grow this map forever. */
export function pruneLoginAttempts(now = Date.now()): void {
  for (const [key, record] of attempts) {
    const stale = now - record.lastAttemptAt > WINDOW_MS && (!record.blockedUntil || record.blockedUntil < now);
    if (stale) attempts.delete(key);
  }
}

/** Confirms a `next` return path is a local admin path — never an open redirect. */
export function safeNextPath(value: string | null | undefined, fallback = "/admin"): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/admin")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\") || trimmed.includes("\n") || trimmed.includes("\r")) return fallback;
  return trimmed;
}
