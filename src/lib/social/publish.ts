import { after } from "next/server";

import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { isSocialPublishingConfigured } from "@/lib/env";
import { adapterForProvider } from "@/lib/social/adapters";
import { publicUrlFor } from "@/lib/social/manual";

import type { Provider, PublishResult, SubjectType } from "@/lib/social/types";

/**
 * Provider-agnostic dispatch: queue a post, then send it without making the
 * admin wait.
 *
 * Two invariants hold throughout this file and are worth stating once:
 *
 *  1. A plaintext token lives only inside `runDispatch`'s local scope, for one
 *     adapter call in the same tick. It is never stored, never returned, never
 *     handed to a component and never put in a log line.
 *  2. On the publish path a credential is always in a request *header*
 *     (LinkedIn) or a request *body* (Facebook) — never in a URL or query
 *     string. That is what makes it safe to log a publish error message here:
 *     by construction, no token can be inside one.
 */

/**
 * In-flight dispatch ids, per process.
 *
 * Same shape as the CV regeneration guard: a second request for a dispatch that
 * is already talking to the provider returns immediately instead of racing the
 * first one and posting the same content twice. Container-local, so it is a
 * best-effort guard rather than a distributed lock — the status check inside
 * `runDispatch` is what makes a retry idempotent across replicas.
 */
const inFlight = new Set<string>();

/* ------------------------------------------------------------------ reading --- */

export interface DispatchLogEntry {
  id: string;
  subjectType: SubjectType;
  subjectId: string;
  subjectLabel: string;
  subjectUrl: string | null;
  provider: Provider;
  status: "DRAFT" | "QUEUED" | "POSTED" | "FAILED" | "NEEDS_RECONNECT";
  message: string;
  externalId: string | null;
  permalink: string | null;
  error: string | null;
  attempts: number;
  postedAt: Date | null;
  createdAt: Date;
}

/**
 * The dispatch log, newest first, with each row's subject resolved to a readable
 * label and public URL so the table needs no further lookups.
 */
export async function listDispatches(limit = 50): Promise<DispatchLogEntry[]> {
  const rows = await prisma.socialDispatch.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: Math.min(Math.max(limit, 1), 200),
    include: {
      experience: { select: { title: true, company: true, slug: true } },
      project: { select: { title: true, slug: true } },
    },
  });

  return rows.map((row) => {
    const slug = row.experience?.slug ?? row.project?.slug ?? null;
    const label = row.experience
      ? `${row.experience.title} — ${row.experience.company}`
      : (row.project?.title ?? "Deleted content");

    return {
      id: row.id,
      subjectType: row.subjectType,
      subjectId: row.subjectId,
      subjectLabel: label,
      subjectUrl: slug ? publicUrlFor({ type: row.subjectType, slug }) : null,
      provider: row.provider,
      status: row.status,
      message: row.message,
      externalId: row.externalId,
      permalink: row.permalink,
      error: row.error,
      attempts: row.attempts,
      postedAt: row.postedAt,
      createdAt: row.createdAt,
    };
  });
}

/* ------------------------------------------------------------------ queuing --- */

export interface QueueDispatchInput {
  subjectType: SubjectType;
  subjectId: string;
  provider: Provider;
  /** The exact post copy. Callers should pass `buildShareText(subject)`. */
  message: string;
  /** Schedule the send now (default). Pass false to leave the row QUEUED. */
  publishNow?: boolean;
}

export type QueueDispatchOutcome =
  | { queued: true; id: string; created: boolean }
  | { queued: false; reason: "empty_message" };

/**
 * Create a QUEUED dispatch, or hand back the one that is already queued.
 *
 * The reuse path matters: an admin save that fires twice (double click, a retry
 * after a network blip) would otherwise leave two QUEUED rows holding identical
 * text, and both would publish. One queued row per content item and provider is
 * the invariant that makes "queue on save" safe.
 *
 * An empty message is refused rather than queued: there is no post to make, and
 * failing loudly here is better than a blank entry in the log.
 */
export async function queueDispatch(input: QueueDispatchInput): Promise<QueueDispatchOutcome> {
  const message = input.message.trim();
  if (!message) return { queued: false, reason: "empty_message" };

  const existing = await prisma.socialDispatch.findFirst({
    where: {
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      provider: input.provider,
      status: "QUEUED",
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (existing) {
    if (input.publishNow !== false) scheduleDispatchPublish(existing.id);
    return { queued: true, id: existing.id, created: false };
  }

  const row = await prisma.socialDispatch.create({
    data: {
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      provider: input.provider,
      status: "QUEUED",
      message,
      // The convenience relations are what let the log show a readable subject
      // and survive without a separate lookup.
      experienceId: input.subjectType === "EXPERIENCE" ? input.subjectId : null,
      projectId: input.subjectType === "PROJECT" ? input.subjectId : null,
    },
    select: { id: true },
  });

  if (input.publishNow !== false) scheduleDispatchPublish(row.id);

  return { queued: true, id: row.id, created: true };
}

/* ---------------------------------------------------------------- scheduling --- */

/**
 * Publish after the current response has been flushed.
 *
 * An admin save must never wait on a third-party API, and a provider outage must
 * never turn a successful save into an error page. The `after` callback is
 * therefore wrapped twice: once so a missing request scope cannot throw at the
 * caller, and once so nothing can escape the callback itself.
 */
export function scheduleDispatchPublish(id: string): void {
  try {
    after(async () => {
      try {
        await publishDispatch(id);
      } catch (error) {
        // Logging the message is safe here — see the file header: on this path a
        // credential is never in a URL, so it cannot be inside the message.
        console.error(
          `[social] background publish failed for dispatch ${id}:`,
          error instanceof Error ? error.message : "unknown error",
        );
      }
    });
  } catch (error) {
    console.error(
      "[social] could not schedule publishing:",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}

/* --------------------------------------------------------------- publishing --- */

async function recordFailure(
  id: string,
  error: string,
  needsReconnect: boolean,
): Promise<PublishResult> {
  const message = error.slice(0, 600);
  await prisma.socialDispatch.update({
    where: { id },
    data: {
      status: needsReconnect ? "NEEDS_RECONNECT" : "FAILED",
      error: message,
      attempts: { increment: 1 },
    },
  });
  return { ok: false, error: message, needsReconnect };
}

async function runDispatch(id: string): Promise<PublishResult> {
  const dispatch = await prisma.socialDispatch.findUnique({
    where: { id },
    include: {
      experience: { select: { slug: true, isPublished: true } },
      project: { select: { slug: true, isPublished: true } },
    },
  });

  if (!dispatch) {
    return { ok: false, error: "That dispatch no longer exists." };
  }

  // Already sent: report the stored outcome instead of posting it a second time.
  if (dispatch.status === "POSTED") {
    return {
      ok: true,
      externalId: dispatch.externalId ?? undefined,
      permalink: dispatch.permalink ?? undefined,
    };
  }

  const subject = dispatch.experience ?? dispatch.project;
  if (!subject) {
    return recordFailure(
      id,
      "The content this dispatch points at has been deleted — there is nothing left to link to.",
      false,
    );
  }

  const account = await prisma.socialAccount.findUnique({
    where: { provider: dispatch.provider },
  });

  if (!account) {
    return recordFailure(
      id,
      `${dispatch.provider === "LINKEDIN" ? "LinkedIn" : "Facebook"} is not connected — use the Connect button above, then post again.`,
      true,
    );
  }

  if (!isSocialPublishingConfigured()) {
    // Fail closed, exactly as `encryptSecret` does: without the key the stored
    // token cannot be decrypted, and nothing may be published by guessing.
    return recordFailure(
      id,
      "SOCIAL_TOKEN_KEY is not set (or is shorter than 32 characters), so the stored token cannot be decrypted. Set it in deploy/.env and restart.",
      true,
    );
  }

  let accessToken: string;
  try {
    accessToken = decryptSecret(account.accessTokenEnc);
  } catch {
    return recordFailure(
      id,
      "The stored token could not be decrypted. It was most likely encrypted with a different SOCIAL_TOKEN_KEY — reconnect the account.",
      true,
    );
  }

  // Only link to the public page when the content is actually published; a post
  // pointing at a 404 would be worse than no link at all.
  const link = subject.isPublished ? publicUrlFor({ type: dispatch.subjectType, slug: subject.slug }) : undefined;

  const adapter = adapterForProvider(dispatch.provider);

  const result = await adapter.publish(
    {
      provider: dispatch.provider,
      accessToken,
      accountRef: account.accountRef,
      displayName: account.displayName,
    },
    dispatch.message,
    link,
  );

  if (result.ok) {
    await prisma.socialDispatch.update({
      where: { id },
      data: {
        status: "POSTED",
        externalId: result.externalId ?? null,
        permalink: result.permalink ?? null,
        postedAt: new Date(),
        error: null,
        attempts: { increment: 1 },
      },
    });
    return result;
  }

  return recordFailure(id, result.error ?? "Publishing failed for an unknown reason.", Boolean(result.needsReconnect));
}

/**
 * Send one dispatch and record the outcome.
 *
 * Safe to call repeatedly: a POSTED row short-circuits, and a concurrent call
 * for the same id is refused by the in-flight guard.
 */
export async function publishDispatch(id: string): Promise<PublishResult> {
  if (inFlight.has(id)) {
    return { ok: false, error: "This post is already being sent." };
  }

  inFlight.add(id);
  try {
    return await runDispatch(id);
  } catch (error) {
    // A provider outage or a network fault must still leave a record the admin
    // can act on, rather than a row stuck on QUEUED for ever.
    return recordFailure(
      id,
      `Unexpected failure while publishing: ${error instanceof Error ? error.message : "unknown error"}`,
      false,
    );
  } finally {
    inFlight.delete(id);
  }
}

/**
 * Re-attempt a dispatch that failed or lost its token.
 *
 * A POSTED row is refused rather than re-sent, so this button can never create a
 * duplicate post.
 */
export async function retryDispatch(id: string): Promise<PublishResult> {
  const row = await prisma.socialDispatch.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!row) return { ok: false, error: "That dispatch no longer exists." };
  if (row.status === "POSTED") {
    return { ok: false, error: "This content has already been posted." };
  }

  return publishDispatch(id);
}

/** True while this process is mid-send for a dispatch. Used by the panel. */
export function isPublishing(id: string): boolean {
  return inFlight.has(id);
}
