"use server";

import { requireAdmin } from "@/lib/auth";
import {
  publishDispatch,
  queueDispatch,
  retryDispatch,
  type QueueDispatchOutcome,
} from "@/lib/social/publish";
import type { Provider, PublishResult, SubjectType } from "@/lib/social/types";

/**
 * Admin-triggered publishing, called from the buttons in the social panel.
 *
 * `requireAdmin()` (not `requireAdminApi()`): a server action has no response
 * body to put a 401 into, so the redirect-to-login behaviour is the correct one.
 * These actions are only ever reachable from an already-guarded admin page, but
 * they re-check anyway — a server action is a public HTTP endpoint.
 *
 * Why these await instead of going through `after()`, when `queueDispatch()` does
 * the opposite: the brief is that an admin *save* must not be blocked by a
 * third-party API, and that holds here too — nothing on the save path waits on
 * this module. But "Post now" and "Retry" are deliberate clicks whose whole
 * point is to learn what the provider said. Returning the real outcome (and the
 * permalink) is the honest result for that click, and the provider call is still
 * off the save path entirely. Background publishing on save is `queueDispatch`,
 * which schedules through `after()`.
 *
 * Return values are `PublishResult`-shaped: an external id, a permalink and a
 * human-readable error. No token, no client secret, nothing credential-shaped can
 * appear in a server action's response by construction, because none of these
 * values ever holds one.
 */

export type DispatchActionResult =
  | { ok: true; externalId?: string; permalink?: string; message: string }
  | { ok: false; message: string; needsReconnect?: boolean };

function toActionError(result: PublishResult, fallback: string): DispatchActionResult {
  return {
    ok: false,
    message: result.error ?? fallback,
    needsReconnect: result.needsReconnect,
  };
}

/** Send a QUEUED dispatch immediately. */
export async function postNowAction(dispatchId: string): Promise<DispatchActionResult> {
  await requireAdmin();

  if (typeof dispatchId !== "string" || !dispatchId.trim()) {
    return { ok: false, message: "No dispatch was selected." };
  }

  const result = await publishDispatch(dispatchId.trim());
  if (!result.ok) return toActionError(result, "Publishing failed.");

  return {
    ok: true,
    externalId: result.externalId,
    permalink: result.permalink,
    message: result.permalink ? "Posted." : "Posted, but the provider returned no public link.",
  };
}

/** Re-attempt a FAILED or NEEDS_RECONNECT dispatch. */
export async function retryDispatchAction(dispatchId: string): Promise<DispatchActionResult> {
  await requireAdmin();

  if (typeof dispatchId !== "string" || !dispatchId.trim()) {
    return { ok: false, message: "No dispatch was selected." };
  }

  const result = await retryDispatch(dispatchId.trim());
  if (!result.ok) return toActionError(result, "The retry did not succeed.");

  return {
    ok: true,
    externalId: result.externalId,
    permalink: result.permalink,
    message: result.permalink
      ? "Posted on the retry."
      : "Posted on the retry, but the provider returned no public link.",
  };
}

/**
 * Queue a post from the admin panel without waiting for it.
 *
 * Exported so the content editors can ask for a publish with one call; the send
 * itself is scheduled with `after()` and never blocks the caller.
 */
export async function queueFromAdminAction(input: {
  subjectType: SubjectType;
  subjectId: string;
  provider: Provider;
  message: string;
}): Promise<QueueDispatchOutcome> {
  await requireAdmin();
  return queueDispatch(input);
}
