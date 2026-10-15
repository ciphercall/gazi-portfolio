import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/lib/env";

/**
 * Prisma 7 no longer ships a Rust query engine — it talks to Postgres through a
 * driver adapter.
 *
 * Construction is lazy on purpose: `next build` imports application modules to
 * analyse them, and a database URL is not present at image-build time. Creating
 * the client eagerly at import would fail the build, so it is created on first
 * property access instead.
 */

const globalForPrisma = globalThis as unknown as { __gaziPrisma?: PrismaClient };

function createClient(): PrismaClient {
  const env = getEnv();
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.__gaziPrisma) {
    globalForPrisma.__gaziPrisma = createClient();
  }
  return globalForPrisma.__gaziPrisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
  has(_target, property) {
    return property in getClient();
  },
});

/** True when the database answers. Used by /api/health — never by a visitor path. */
export async function databaseIsReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
