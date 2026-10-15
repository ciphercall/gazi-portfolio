import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  verifySession,
  type SessionPayload,
} from "@/lib/session";

/** Server-only auth. Imported by admin routes and server actions, never by middleware. */

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<SessionPayload | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    // Still spend the time, so a missing account and a wrong password are indistinguishable.
    await bcrypt.compare(password, "$2a$12$0000000000000000000000000000000000000000000000000000");
    return null;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { sub: user.id, email: user.email, name: user.name };
}

export async function startSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Every admin page and admin API route starts with this. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** API-route variant: returns null instead of redirecting. */
export async function requireAdminApi(): Promise<SessionPayload | null> {
  return getSession();
}
