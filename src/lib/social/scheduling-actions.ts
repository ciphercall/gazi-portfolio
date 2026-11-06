"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { ensureCardForDispatch } from "@/lib/social/card";
import {
  autoScheduleAll,
  planProjectPosts,
  rescheduleDispatch,
  setProjectSelected,
} from "@/lib/social/planner";
import { cancelDispatch, publishDueDispatches, setDispatchMessage } from "@/lib/social/publish";

/**
 * Server actions for the scheduling panel.
 *
 * Every one of them re-checks `requireAdmin()` — a server action is a public HTTP
 * endpoint regardless of which page rendered the button.
 *
 * The results are plain `{ ok, message }` so the panel's existing toast plumbing
 * can report them without a second adapter.
 */

export type ScheduleActionResult =
  | { ok: true; message: string; data?: Record<string, unknown> }
  | { ok: false; message: string };

function failure(error: unknown, fallback: string): ScheduleActionResult {
  return { ok: false, message: error instanceof Error ? error.message : fallback };
}

function refresh(): void {
  revalidatePath("/admin/social");
  revalidatePath("/admin/social/settings");
}

/** Give every published project without a post one, on the next free day. */
export async function planPostsAction(): Promise<ScheduleActionResult> {
  await requireAdmin();
  try {
    const result = await planProjectPosts();
    refresh();
    return {
      ok: true,
      message:
        result.created === 0
          ? "Nothing to plan — every published project already has a post."
          : `Prepared ${result.created} new post(s).`,
      data: { created: result.created },
    };
  } catch (error) {
    return failure(error, "The plan could not be rebuilt.");
  }
}

/** Compact the calendar: one post per day, consecutive, starting tomorrow. */
export async function autoScheduleAction(): Promise<ScheduleActionResult> {
  await requireAdmin();
  try {
    const result = await autoScheduleAll();
    refresh();
    return { ok: true, message: `Scheduled ${result.scheduled} post(s), one per day.` };
  } catch (error) {
    return failure(error, "The schedule could not be rebuilt.");
  }
}

export async function selectProjectAction(input: {
  projectId: string;
  selected: boolean;
}): Promise<ScheduleActionResult> {
  await requireAdmin();
  try {
    const result = await setProjectSelected(input.projectId, input.selected);
    refresh();
    return result;
  } catch (error) {
    return failure(error, "That project could not be updated.");
  }
}

export async function rescheduleAction(input: {
  dispatchId: string;
  date: string;
  time: string;
}): Promise<ScheduleActionResult> {
  await requireAdmin();
  try {
    const result = await rescheduleDispatch(input.dispatchId, {
      date: input.date,
      time: input.time,
    });
    refresh();
    return result.ok
      ? { ok: true, message: "Moved to that day. Only one post per day is allowed, so check the list." }
      : result;
  } catch (error) {
    return failure(error, "That date could not be saved.");
  }
}

export async function savePostTextAction(input: {
  dispatchId: string;
  message: string;
}): Promise<ScheduleActionResult> {
  await requireAdmin();
  try {
    const result = await setDispatchMessage(input.dispatchId, input.message);
    refresh();
    return result.ok ? { ok: true, message: "Post copy saved." } : result;
  } catch (error) {
    return failure(error, "The post copy could not be saved.");
  }
}

export async function cancelPostAction(dispatchId: string): Promise<ScheduleActionResult> {
  await requireAdmin();
  try {
    const result = await cancelDispatch(dispatchId);
    refresh();
    return result.ok ? { ok: true, message: "Prepared post removed." } : result;
  } catch (error) {
    return failure(error, "That post could not be removed.");
  }
}

/** Force a card re-render and return its media URL. */
export async function renderCardAction(dispatchId: string): Promise<ScheduleActionResult> {
  await requireAdmin();
  try {
    const url = await ensureCardForDispatch(dispatchId);
    refresh();
    return url
      ? { ok: true, message: "Card rendered.", data: { imagePath: url } }
      : { ok: false, message: "The card could not be rendered. Check the scheduler log." };
  } catch (error) {
    return failure(error, "The card could not be rendered.");
  }
}

/** Run one scheduler tick now — used by the panel and by `-Action publish-due`. */
export async function publishDueAction(): Promise<ScheduleActionResult> {
  await requireAdmin();
  try {
    const result = await publishDueDispatches(5);
    refresh();
    if (result.skipped) {
      return { ok: false, message: "Skipped — auto-publish is off, or another run is in progress." };
    }
    if (result.attempted === 0) {
      return { ok: true, message: "No post is due right now." };
    }
    return {
      ok: true,
      message: `Sent ${result.published}, failed ${result.failed} of ${result.attempted}.`,
    };
  } catch (error) {
    return failure(error, "The tick could not run.");
  }
}
