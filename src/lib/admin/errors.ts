/**
 * Turns a thrown database error into a sentence the panel can show.
 *
 * Server actions never leak a Prisma stack trace into the UI, but they also
 * must not swallow the difference between "that slug is taken" and "the
 * database is down" — the owner needs to know which one he is looking at.
 */

export function describePrismaError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;

  const code = (error as { code?: unknown }).code;

  if (code === "P2002") {
    const target = (error as { meta?: { target?: unknown } }).meta?.target;
    const fields = Array.isArray(target) ? target.join(", ") : typeof target === "string" ? target : "";
    return fields
      ? `Another record already uses that ${fields}.`
      : "That value is already used by another record.";
  }

  if (code === "P2025") {
    return "That record no longer exists — it may have been deleted in another tab.";
  }

  if (code === "P2003") {
    return "That change breaks a reference to another record.";
  }

  if (code === "P1001" || code === "P1017") {
    return "The database is unreachable. Check the stack, then try again.";
  }

  return fallback;
}

/** A readable message for anything thrown, without ever rendering "[object Object]". */
export function describeUnknownError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}
